/**
 * 🤖 AI Financial Assistant Service
 * 
 * Natural language financial queries powered by OpenAI GPT-4.
 * Provides contextual answers based on user's financial data.
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/db'
import { AI_CONFIG, APP_CONFIG } from '@/lib/config'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

// ========================================
// Types
// ========================================

export type QueryType = 
  | 'FINANCIAL_SUMMARY'
  | 'PREDICTION'
  | 'REPORT'
  | 'OPTIMIZATION'
  | 'GENERAL'

export interface AIQueryRequest {
  userId: string
  query: string
  context?: Record<string, any>
}

export interface AIQueryResponse {
  response: string
  queryType: QueryType
  context: Record<string, any>
  suggestions?: string[]
  tokensUsed: number
  responseTime: number
}

// ========================================
// AI Assistant Service
// ========================================

export class AIAssistantService {
  private openai: OpenAI | null = null

  constructor() {
    if (AI_CONFIG.openai.apiKey && !APP_CONFIG.mock.aiApi) {
      this.openai = new OpenAI({
        apiKey: AI_CONFIG.openai.apiKey,
      })
    }
  }

  /**
   * Process natural language query
   */
  async query(request: AIQueryRequest): Promise<AIQueryResponse> {
    const startTime = Date.now()

    // Gather financial context for the user
    const context = await this.gatherContext(request.userId, request.query)

    // Generate AI response
    const aiResponse = await this.generateResponse(request.query, context)

    const responseTime = Date.now() - startTime

    // Save query to database
    await this.saveQuery({
      userId: request.userId,
      query: request.query,
      response: aiResponse.response,
      queryType: aiResponse.queryType,
      context,
      tokensUsed: aiResponse.tokensUsed,
      responseTime,
    })

    return {
      ...aiResponse,
      responseTime,
    }
  }

  /**
   * Gather financial context for AI
   */
  private async gatherContext(
    userId: string,
    query: string
  ): Promise<Record<string, any>> {
    const context: Record<string, any> = {}

    // Current month data
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Get current month invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    })

    context.currentMonthInvoices = {
      count: invoices.length,
      totalRevenue: invoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0),
      paid: invoices.filter(inv => inv.status === 'PAID').length,
      unpaid: invoices.filter(inv => inv.status === 'ISSUED').length,
    }

    // Get current month expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    })

    context.currentMonthExpenses = {
      count: expenses.length,
      totalExpenses: expenses.reduce((sum, exp) => sum + Number(exp.grossAmount), 0),
      byCategory: this.groupByCategory(expenses),
    }

    // Net profit
    context.currentMonthNetProfit = 
      context.currentMonthInvoices.totalRevenue - context.currentMonthExpenses.totalExpenses

    // Get previous months for comparison (if query mentions trends/comparison)
    if (this.needsHistoricalData(query)) {
      context.historicalData = await this.getHistoricalData(userId, 6)
    }

    // Get outstanding invoices
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'ISSUED',
      },
    })

    context.outstandingInvoices = {
      count: outstandingInvoices.length,
      totalAmount: outstandingInvoices.reduce((sum, inv) => sum + Number(inv.totalGross), 0),
    }

    // Get upcoming tax events
    const upcomingTaxEvents = await prisma.taxEvent.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          gte: now,
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    })

    context.upcomingTaxEvents = upcomingTaxEvents.map(event => ({
      title: event.title,
      dueDate: format(event.dueDate, 'yyyy-MM-dd'),
      description: event.description,
    }))

    // Get latest tax calculation
    const latestTaxCalc = await prisma.taxCalculation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (latestTaxCalc) {
      context.latestTaxCalculation = {
        period: `${latestTaxCalc.periodType}`,
        revenue: Number(latestTaxCalc.totalRevenue),
        expenses: Number(latestTaxCalc.totalExpenses),
        taxLiability: Number(latestTaxCalc.totalTaxLiability),
      }
    }

    // Get bank balance (if connected)
    const bankConnections = await prisma.bankConnection.findMany({
      where: {
        userId,
        isActive: true,
      },
      take: 1,
    })

    if (bankConnections.length > 0) {
      // Get latest transactions to estimate balance
      const recentTransactions = await prisma.bankTransaction.findMany({
        where: {
          bankConnectionId: bankConnections[0].id,
        },
        orderBy: {
          date: 'desc',
        },
        take: 10,
      })

      context.bankData = {
        connected: true,
        recentTransactions: recentTransactions.length,
      }
    }

    return context
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateResponse(
    query: string,
    context: Record<string, any>
  ): Promise<{
    response: string
    queryType: QueryType
    tokensUsed: number
    suggestions?: string[]
  }> {
    // Mock mode
    if (APP_CONFIG.mock.aiApi || !this.openai) {
      return this.mockResponse(query, context)
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context)
      
      const completion = await this.openai.chat.completions.create({
        model: AI_CONFIG.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        max_tokens: AI_CONFIG.openai.maxTokens,
        temperature: 0.7,
      })

      const response = completion.choices[0]?.message?.content || 'Przepraszam, nie mogłem wygenerować odpowiedzi.'
      const tokensUsed = completion.usage?.total_tokens || 0

      // Detect query type from response
      const queryType = this.detectQueryType(query)

      // Generate follow-up suggestions
      const suggestions = this.generateSuggestions(queryType, context)

      return {
        response,
        queryType,
        tokensUsed,
        suggestions,
      }
    } catch (error: any) {
      console.error('OpenAI API error:', error.message)
      
      return {
        response: 'Przepraszam, wystąpił błąd podczas przetwarzania zapytania. Spróbuj ponownie później.',
        queryType: 'GENERAL',
        tokensUsed: 0,
      }
    }
  }

  /**
   * Build system prompt with financial context
   */
  private buildSystemPrompt(context: Record<string, any>): string {
    return `Jesteś ekspertem finansowym i asystentem AI dla polskiej aplikacji biznesowej BizOps.

Pomóż użytkownikowi zrozumieć jego sytuację finansową i odpowiedz na pytania dotyczące jego działalności.

KONTEKST FINANSOWY UŻYTKOWNIKA:

Bieżący miesiąc:
- Przychody: ${context.currentMonthInvoices?.totalRevenue || 0} PLN (${context.currentMonthInvoices?.count || 0} faktur)
- Koszty: ${context.currentMonthExpenses?.totalExpenses || 0} PLN (${context.currentMonthExpenses?.count || 0} pozycji)
- Zysk netto: ${context.currentMonthNetProfit || 0} PLN
- Nieopłacone faktury: ${context.outstandingInvoices?.count || 0} (${context.outstandingInvoices?.totalAmount || 0} PLN)

${context.latestTaxCalculation ? `
Ostatnie rozliczenie podatkowe (${context.latestTaxCalculation.period}):
- Przychody: ${context.latestTaxCalculation.revenue} PLN
- Koszty: ${context.latestTaxCalculation.expenses} PLN
- Zobowiązania podatkowe: ${context.latestTaxCalculation.taxLiability} PLN
` : ''}

${context.upcomingTaxEvents?.length > 0 ? `
Nadchodzące terminy:
${context.upcomingTaxEvents.map((e: any) => `- ${e.title} (${e.dueDate})`).join('\n')}
` : ''}

${context.historicalData ? `
Dane historyczne (ostatnie 6 miesięcy):
${JSON.stringify(context.historicalData, null, 2)}
` : ''}

ZASADY:
1. Odpowiadaj w języku polskim
2. Używaj konkretnych liczb z kontekstu
3. Bądź zwięzły ale dokładny
4. Jeśli brakuje danych, zaznacz to
5. Sugeruj działania jeśli to możliwe
6. Używaj formatowania markdown
7. Podawaj kwoty w PLN
8. Odnośniki do przepisów podatkowych (2025)

Odpowiadaj profesjonalnie, jak doświadczony księgowy lub doradca finansowy.`
  }

  /**
   * Detect query type from user question
   */
  private detectQueryType(query: string): QueryType {
    const lowerQuery = query.toLowerCase()

    if (
      lowerQuery.includes('podsumowanie') ||
      lowerQuery.includes('ile') ||
      lowerQuery.includes('jaki był') ||
      lowerQuery.includes('wynik')
    ) {
      return 'FINANCIAL_SUMMARY'
    }

    if (
      lowerQuery.includes('prognoza') ||
      lowerQuery.includes('przewiduj') ||
      lowerQuery.includes('szacuj') ||
      lowerQuery.includes('następny')
    ) {
      return 'PREDICTION'
    }

    if (
      lowerQuery.includes('raport') ||
      lowerQuery.includes('zestawienie') ||
      lowerQuery.includes('wygeneruj')
    ) {
      return 'REPORT'
    }

    if (
      lowerQuery.includes('optymalizuj') ||
      lowerQuery.includes('oszczędź') ||
      lowerQuery.includes('zmniejsz') ||
      lowerQuery.includes('zaoszczędzić')
    ) {
      return 'OPTIMIZATION'
    }

    return 'GENERAL'
  }

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(
    queryType: QueryType,
    context: Record<string, any>
  ): string[] {
    const suggestions: string[] = []

    switch (queryType) {
      case 'FINANCIAL_SUMMARY':
        suggestions.push('Jaki był mój zysk w poprzednim kwartale?')
        suggestions.push('Porównaj przychody z ostatnich 3 miesięcy')
        break
      
      case 'PREDICTION':
        suggestions.push('Jakie będą moje zobowiązania podatkowe w tym kwartale?')
        suggestions.push('Czy wystarczy mi gotówki na koniec miesiąca?')
        break
      
      case 'OPTIMIZATION':
        suggestions.push('W których kategoriach najwięcej wydaję?')
        suggestions.push('Jak mogę zmniejszyć koszty?')
        break
      
      case 'REPORT':
        suggestions.push('Wygeneruj raport dla księgowej')
        suggestions.push('Podsumuj moje finanse za ostatni rok')
        break
      
      default:
        suggestions.push('Co powinienem zapłacić w tym miesiącu?')
        suggestions.push('Jakie mam najbliższe terminy podatkowe?')
    }

    return suggestions
  }

  /**
   * Check if query needs historical data
   */
  private needsHistoricalData(query: string): boolean {
    const keywords = [
      'trend', 'porównaj', 'poprzedni', 'ostatni', 'wzrost',
      'spadek', 'zmiana', 'historyczny', 'rok', 'kwartał'
    ]
    
    return keywords.some(keyword => query.toLowerCase().includes(keyword))
  }

  /**
   * Get historical financial data
   */
  private async getHistoricalData(userId: string, months: number) {
    const data: any[] = []
    
    for (let i = 0; i < months; i++) {
      const date = subMonths(new Date(), i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      const invoices = await prisma.invoice.findMany({
        where: {
          userId,
          issueDate: { gte: start, lte: end },
        },
      })

      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
      })

      const revenue = invoices.reduce((sum, inv) => sum + Number(inv.totalNet), 0)
      const costs = expenses.reduce((sum, exp) => sum + Number(exp.netAmount), 0)

      data.push({
        month: format(date, 'yyyy-MM'),
        revenue,
        costs,
        profit: revenue - costs,
      })
    }

    return data.reverse()
  }

  /**
   * Group expenses by category
   */
  private groupByCategory(expenses: any[]): Record<string, number> {
    const grouped: Record<string, number> = {}
    
    expenses.forEach(exp => {
      const category = exp.category || 'Inne'
      grouped[category] = (grouped[category] || 0) + Number(exp.netAmount)
    })

    return grouped
  }

  /**
   * Save query to database
   */
  private async saveQuery(data: {
    userId: string
    query: string
    response: string
    queryType: QueryType
    context: Record<string, any>
    tokensUsed: number
    responseTime: number
  }) {
    return await prisma.aIQuery.create({
      data: {
        userId: data.userId,
        query: data.query,
        response: data.response,
        queryType: data.queryType,
        context: JSON.stringify(data.context),
        tokensUsed: data.tokensUsed,
        modelVersion: AI_CONFIG.openai.model,
        responseTime: data.responseTime,
      },
    })
  }

  /**
   * Mock response for testing
   */
  private mockResponse(
    query: string,
    context: Record<string, any>
  ): {
    response: string
    queryType: QueryType
    tokensUsed: number
    suggestions: string[]
  } {
    const queryType = this.detectQueryType(query)
    
    let response = `**Odpowiedź na pytanie:** "${query}"\n\n`
    response += `W tym miesiącu:\n`
    response += `- Przychody: **${context.currentMonthInvoices?.totalRevenue || 0} PLN**\n`
    response += `- Koszty: **${context.currentMonthExpenses?.totalExpenses || 0} PLN**\n`
    response += `- Zysk netto: **${context.currentMonthNetProfit || 0} PLN**\n\n`
    response += `Masz ${context.outstandingInvoices?.count || 0} nieopłaconych faktur na kwotę ${context.outstandingInvoices?.totalAmount || 0} PLN.\n\n`
    response += `*Uwaga: Używasz trybu testowego AI. Podłącz klucz OpenAI API dla pełnej funkcjonalności.*`

    return {
      response,
      queryType,
      tokensUsed: 0,
      suggestions: this.generateSuggestions(queryType, context),
    }
  }

  /**
   * Generate AI insights (proactive suggestions)
   */
  async generateInsights(userId: string): Promise<void> {
    const context = await this.gatherContext(userId, '')

    const insights: any[] = []

    // Insight 1: High expenses
    if (context.currentMonthExpenses?.totalExpenses > context.currentMonthInvoices?.totalRevenue) {
      insights.push({
        userId,
        insightType: 'ANOMALY',
        title: 'Koszty przekraczają przychody',
        description: `W tym miesiącu Twoje koszty (${context.currentMonthExpenses.totalExpenses} PLN) są wyższe niż przychody (${context.currentMonthInvoices.totalRevenue} PLN). Sprawdź wydatki.`,
        severity: 'WARNING',
        category: 'EXPENSE',
        actionable: true,
        suggestedAction: 'Przejrzyj kategorie kosztów i zidentyfikuj możliwości oszczędności',
      })
    }

    // Insight 2: Outstanding invoices
    if (context.outstandingInvoices?.count > 5) {
      insights.push({
        userId,
        insightType: 'RECOMMENDATION',
        title: 'Dużo nieopłaconych faktur',
        description: `Masz ${context.outstandingInvoices.count} nieopłaconych faktur o wartości ${context.outstandingInvoices.totalAmount} PLN. Rozważ przypomnienie klientom.`,
        severity: 'INFO',
        category: 'REVENUE',
        actionable: true,
        suggestedAction: 'Wyślij przypomnienia o płatności do klientów',
      })
    }

    // Insight 3: Upcoming tax deadlines
    if (context.upcomingTaxEvents?.length > 0) {
      const nextEvent = context.upcomingTaxEvents[0]
      insights.push({
        userId,
        insightType: 'RECOMMENDATION',
        title: 'Zbliżający się termin podatkowy',
        description: `${nextEvent.title} - termin: ${nextEvent.dueDate}`,
        severity: 'HIGH',
        category: 'TAX',
        actionable: true,
        suggestedAction: 'Przygotuj dokumenty i dokonaj płatności przed terminem',
      })
    }

    // Save insights to database
    for (const insight of insights) {
      await prisma.aIInsight.create({ data: insight })
    }
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Query AI assistant
 */
export async function queryAI(userId: string, query: string) {
  const assistant = new AIAssistantService()
  return await assistant.query({ userId, query })
}

/**
 * Generate proactive insights for user
 */
export async function generateUserInsights(userId: string) {
  const assistant = new AIAssistantService()
  return await assistant.generateInsights(userId)
}


