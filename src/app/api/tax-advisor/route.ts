import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper function to get financial context
async function getFinancialContext(userId: string) {
  const [settings, invoices, expenses, projects, contractors] = await Promise.all([
    prisma.settings.findUnique({ where: { userId } }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { issueDate: 'desc' },
      take: 50,
      include: { buyer: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50,
      include: { contractor: true },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.contractor.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
  ])

  // Calculate statistics
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  const invoicesThisYear = invoices.filter(i => new Date(i.issueDate).getFullYear() === currentYear)
  const invoicesThisMonth = invoices.filter(i => {
    const date = new Date(i.issueDate)
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth
  })
  
  const expensesThisYear = expenses.filter(e => new Date(e.date).getFullYear() === currentYear)
  const expensesThisMonth = expenses.filter(e => {
    const date = new Date(e.date)
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth
  })

  const totalRevenueYear = invoicesThisYear.reduce((sum, inv) => sum + Number(inv.totalGross), 0)
  const totalRevenueMonth = invoicesThisMonth.reduce((sum, inv) => sum + Number(inv.totalGross), 0)
  const totalExpensesYear = expensesThisYear.reduce((sum, exp) => sum + Number(exp.totalGross), 0)
  const totalExpensesMonth = expensesThisMonth.reduce((sum, exp) => sum + Number(exp.totalGross), 0)

  const vatToPayYear = invoicesThisYear.reduce((sum, inv) => sum + Number(inv.totalVat), 0) -
                        expensesThisYear.reduce((sum, exp) => sum + Number(exp.totalVat || 0), 0)
  
  const vatToPayMonth = invoicesThisMonth.reduce((sum, inv) => sum + Number(inv.totalVat), 0) -
                         expensesThisMonth.reduce((sum, exp) => sum + Number(exp.totalVat || 0), 0)

  return {
    settings,
    stats: {
      totalInvoices: invoices.length,
      totalExpenses: expenses.length,
      totalProjects: projects.length,
      totalContractors: contractors.length,
      revenueThisYear: totalRevenueYear,
      revenueThisMonth: totalRevenueMonth,
      expensesThisYear: totalExpensesYear,
      expensesThisMonth: totalExpensesMonth,
      profitThisYear: totalRevenueYear - totalExpensesYear,
      profitThisMonth: totalRevenueMonth - totalExpensesMonth,
      vatToPayYear,
      vatToPayMonth,
    },
    recentInvoices: invoicesThisMonth.slice(0, 5).map(inv => ({
      number: inv.number,
      buyer: inv.buyer?.name || 'Nieznany',
      totalGross: Number(inv.totalGross),
      totalVat: Number(inv.totalVat),
      status: inv.status,
      issueDate: inv.issueDate,
    })),
    recentExpenses: expensesThisMonth.slice(0, 5).map(exp => ({
      description: exp.description,
      contractor: exp.contractorName || exp.contractor?.name || 'Nieznany',
      totalGross: Number(exp.totalGross),
      totalVat: Number(exp.totalVat || 0),
      category: exp.category,
      date: exp.date,
    })),
    topContractors: contractors.slice(0, 5).map(c => ({ name: c.name, nip: c.nip })),
  }
}

// Intelligent tax advisor logic
function generateAdvice(question: string, context: any, conversationHistory: any[]) {
  const lowerQuestion = question.toLowerCase()
  const stats = context.stats
  
  // Contextual greetings and check-ins
  if (
    lowerQuestion.includes('cześć') ||
    lowerQuestion.includes('witaj') ||
    lowerQuestion.includes('dzień dobry') ||
    lowerQuestion.includes('hej')
  ) {
    return {
      content: `Dzień dobry! 👋 Cieszę się, że mogę Ci pomóc.\n\nWidzę, że w tym miesiącu:\n• Wystawiłeś ${context.recentInvoices.length} faktur na kwotę ${stats.revenueThisMonth.toFixed(2)} zł\n• Zarejestrowałeś ${context.recentExpenses.length} kosztów na kwotę ${stats.expensesThisMonth.toFixed(2)} zł\n• Twój zysk w tym miesiącu wynosi ${stats.profitThisMonth.toFixed(2)} zł\n\nJak mogę Ci dzisiaj pomóc? Mogę:\n• Przeanalizować Twoją sytuację podatkową\n• Doradzić w kwestiach VAT, PIT, ZUS\n• Pomóc zoptymalizować koszty\n• Odpowiedzieć na pytania o faktury i księgowość`,
      followUp: [
        'Jak wygląda moja sytuacja podatkowa?',
        'Ile VAT muszę zapłacić?',
        'Czy mogę coś zoptymalizować?',
      ],
    }
  }

  // Situation analysis
  if (
    lowerQuestion.includes('sytuacja') ||
    lowerQuestion.includes('analiza') ||
    lowerQuestion.includes('jak wygląd') ||
    lowerQuestion.includes('podsumowanie')
  ) {
    const analysis = `📊 **Analiza Twojej sytuacji podatkowej**\n\n**Przychody (${new Date().getFullYear()}):**\n• Rok: ${stats.revenueThisYear.toFixed(2)} zł\n• Miesiąc: ${stats.revenueThisMonth.toFixed(2)} zł\n• Średnia miesięczna: ${(stats.revenueThisYear / (new Date().getMonth() + 1)).toFixed(2)} zł\n\n**Koszty (${new Date().getFullYear()}):**\n• Rok: ${stats.expensesThisYear.toFixed(2)} zł\n• Miesiąc: ${stats.expensesThisMonth.toFixed(2)} zł\n• Wskaźnik kosztów: ${((stats.expensesThisYear / stats.revenueThisYear) * 100).toFixed(1)}%\n\n**Zysk:**\n• Rok: ${stats.profitThisYear.toFixed(2)} zł\n• Miesiąc: ${stats.profitThisMonth.toFixed(2)} zł\n• Marża zysku: ${((stats.profitThisYear / stats.revenueThisYear) * 100).toFixed(1)}%\n\n**VAT:**\n• Do zapłaty za rok: ${stats.vatToPayYear.toFixed(2)} zł\n• Do zapłaty za miesiąc: ${stats.vatToPayMonth.toFixed(2)} zł\n\n${stats.profitThisYear > 120000 ? '⚠️ **Uwaga:** Twoje przychody przekroczyły 120,000 zł. Jeśli rozliczasz się według skali podatkowej, od nadwyżki zapłacisz 32% PIT zamiast 12%.' : ''}\n\n${stats.expensesThisYear / stats.revenueThisYear < 0.3 ? '💡 **Sugestia:** Twoje koszty stanowią mniej niż 30% przychodów. Upewnij się, że ewidencjonujesz wszystkie dozwolone koszty uzyskania przychodu!' : ''}\n\nCzy chciałbyś, żebym przeanalizował konkretny obszar bardziej szczegółowo?`
    
    return {
      content: analysis,
      followUp: [
        'Jak mogę zoptymalizować koszty?',
        'Ile PIT zapłacę za ten rok?',
        'Czy powinienem zmienić formę opodatkowania?',
        'Jakie koszty mogę jeszcze odliczyć?',
      ],
    }
  }

  // VAT analysis
  if (
    lowerQuestion.includes('vat') ||
    lowerQuestion.includes('ile vat') ||
    lowerQuestion.includes('vat do zapłaty')
  ) {
    const vatAnalysis = `💶 **Analiza VAT**\n\n**VAT należny (ze sprzedaży):**\n• Rok: ${context.stats.revenueThisYear > 0 ? (stats.revenueThisYear * 0.23 / 1.23).toFixed(2) : '0.00'} zł\n• Miesiąc: ${context.stats.revenueThisMonth > 0 ? (stats.revenueThisMonth * 0.23 / 1.23).toFixed(2) : '0.00'} zł\n\n**VAT naliczony (z zakupów):**\n• Rok: ${(stats.expensesThisYear * 0.23 / 1.23).toFixed(2)} zł\n• Miesiąc: ${(stats.expensesThisMonth * 0.23 / 1.23).toFixed(2)} zł\n\n**VAT do zapłaty:**\n• Za rok: ${stats.vatToPayYear.toFixed(2)} zł\n• Za miesiąc: ${stats.vatToPayMonth.toFixed(2)} zł\n\n**Ostatnie faktury sprzedaży:**\n${context.recentInvoices.slice(0, 3).map((inv: any, i: number) => `${i + 1}. ${inv.number} - ${inv.buyer} - VAT: ${inv.totalVat.toFixed(2)} zł (${inv.status})`).join('\n')}\n\n**Terminy:**\n${context.settings?.vatPeriod === 'monthly' ? '• Deklaracja JPK_VAT: do 25. dnia następnego miesiąca\n• Płatność: do 25. dnia następnego miesiąca' : '• Deklaracja JPK_VAT: do 25. dnia po kwartale\n• Płatność: do 25. dnia po kwartale'}\n\n${stats.vatToPayMonth < 0 ? '✅ Gratulacje! Masz nadwyżkę VAT naliczonego. Możesz ubiegać się o zwrot lub przenieść na następny miesiąc.' : '💡 Pamiętaj o terminowej płatności VAT, aby uniknąć odsetek!'}`

    return {
      content: vatAnalysis,
      followUp: [
        'Jak mogę zwiększyć VAT naliczony?',
        'Co jeśli zapłacę VAT po terminie?',
        'Kiedy złożyć JPK_VAT?',
        'Co to jest nadwyżka VAT?',
      ],
    }
  }

  // Cost optimization
  if (
    lowerQuestion.includes('optymalizacj') ||
    lowerQuestion.includes('oszczędz') ||
    lowerQuestion.includes('zmniejsz') ||
    lowerQuestion.includes('koszty')
  ) {
    const suggestions = []
    
    if (stats.expensesThisYear / stats.revenueThisYear < 0.3) {
      suggestions.push('📝 Ewidencjonuj wszystkie koszty - obecnie Twoje koszty to tylko ' + ((stats.expensesThisYear / stats.revenueThisYear) * 100).toFixed(1) + '% przychodów')
    }
    
    if (context.settings?.homeOffice) {
      suggestions.push('🏠 Odliczasz już koszty home office - świetnie!')
    } else {
      suggestions.push('🏠 Rozważ odliczenie kosztów home office (do 600 zł/m-c)')
    }
    
    if (context.recentExpenses.filter((e: any) => e.category === 'Transport').length > 0) {
      suggestions.push('🚗 Masz koszty transportu - pamiętaj o prowadzeniu ewidencji przebiegu pojazdu')
    } else {
      suggestions.push('🚗 Czy używasz samochodu do działalności? Możesz odliczyć paliwo i inne koszty')
    }
    
    suggestions.push('💻 Odliczaj wszystkie wydatki związane z działalnością: oprogramowanie, sprzęt, szkolenia')
    suggestions.push('📱 Internet, telefon - jeśli służą do działalności, to pełnoprawne koszty')
    suggestions.push('☕ Spotkania biznesowe - faktury z restauracji mogą być kosztem (do 50% wartości)')

    const content = `💡 **Optymalizacja kosztów podatkowych**\n\n**Twoja sytuacja:**\n• Przychody w tym roku: ${stats.revenueThisYear.toFixed(2)} zł\n• Koszty: ${stats.expensesThisYear.toFixed(2)} zł (${((stats.expensesThisYear / stats.revenueThisYear) * 100).toFixed(1)}%)\n\n**Sugestie optymalizacji:**\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}\n\n**Najczęstsze zapomniane koszty:**\n• Szkolenia i kursy online\n• Prenumeraty i subskrypcje biznesowe\n• Materiały biurowe\n• Koszty bankowe i prowizje\n• Amortyzacja sprzętu\n\nCzy chciałbyś, żebym pomógł Ci z jakimś konkretnym rodzajem kosztów?`

    return {
      content,
      followUp: [
        'Jak odliczyć koszty home office?',
        'Jakie koszty samochodu mogę odliczyć?',
        'Co to jest amortyzacja?',
        'Czy mogę odliczyć szkolenia?',
      ],
    }
  }

  // PIT calculations
  if (
    lowerQuestion.includes('pit') ||
    lowerQuestion.includes('podatek dochodowy') ||
    lowerQuestion.includes('ile zapłacę')
  ) {
    const profit = stats.profitThisYear
    let pitAmount = 0
    let taxRate = ''
    
    // Assuming skala podatkowa for calculation
    if (profit <= 30000) {
      pitAmount = 0
      taxRate = '0% (kwota wolna)'
    } else if (profit <= 120000) {
      pitAmount = (profit - 30000) * 0.12
      taxRate = '12%'
    } else {
      pitAmount = (120000 - 30000) * 0.12 + (profit - 120000) * 0.32
      taxRate = '12% do 120k, potem 32%'
    }

    // Linear tax comparison
    const pitLinear = profit * 0.19

    const content = `💰 **Szacunkowy podatek dochodowy za ${new Date().getFullYear()}**\n\n**Dane:**\n• Przychody: ${stats.revenueThisYear.toFixed(2)} zł\n• Koszty: ${stats.expensesThisYear.toFixed(2)} zł\n• Zysk (dochód): ${profit.toFixed(2)} zł\n\n**Skala podatkowa (12% / 32%):**\n• Stawka: ${taxRate}\n• Szacunkowy PIT: ${pitAmount.toFixed(2)} zł\n• Do wypłaty po opodatkowaniu: ${(profit - pitAmount).toFixed(2)} zł\n\n**Podatek liniowy (19%):**\n• Stawka: 19%\n• Szacunkowy PIT: ${pitLinear.toFixed(2)} zł\n• Do wypłaty po opodatkowaniu: ${(profit - pitLinear).toFixed(2)} zł\n\n${pitLinear < pitAmount ? '💡 **Sugestia:** Podatek liniowy byłby dla Ciebie korzystniejszy o ' + (pitAmount - pitLinear).toFixed(2) + ' zł!' : '✅ Skala podatkowa jest dla Ciebie korzystniejsza.'}\n\n⚠️ **Uwaga:** To szacunki uproszczone. Rzeczywisty podatek może być inny ze względu na:\n• Składki ZUS (można odliczyć)\n• Ulgę dla klasy średniej\n• Inne ulgi podatkowe\n• Zaliczki płacone w ciągu roku\n\nCzy chciałbyś, żebym wytłumaczył jakiś aspekt bardziej szczegółowo?`

    return {
      content,
      followUp: [
        'Jakie ulgi podatkowe mogę wykorzystać?',
        'Czy mogę odliczyć składki ZUS?',
        'Kiedy składać zeznanie PIT?',
        'Co to jest ulga dla klasy średniej?',
      ],
    }
  }

  // Invoice questions with context
  if (lowerQuestion.includes('faktura') || lowerQuestion.includes('faktur')) {
    const unpaidInvoices = context.recentInvoices.filter((inv: any) => inv.status === 'unpaid')
    
    let contextInfo = ''
    if (unpaidInvoices.length > 0) {
      contextInfo = `\n\n⚠️ **Uwaga:** Masz ${unpaidInvoices.length} nieopłaconych faktur:\n${unpaidInvoices.map((inv: any, i: number) => `${i + 1}. ${inv.number} - ${inv.buyer} - ${inv.totalGross.toFixed(2)} zł`).join('\n')}\n\nPamiętaj, że VAT należy odprowadzić nawet jeśli faktura nie została opłacona!`
    }

    if (lowerQuestion.includes('termin') || lowerQuestion.includes('kiedy')) {
      return {
        content: `📅 **Terminy wystawiania faktur**\n\n**Podstawowe zasady:**\n• Dla dostaw towarów: do 15. dnia miesiąca następnego\n• Dla usług: do 15. dnia miesiąca następnego\n• Przy przedpłacie: do 15. dnia miesiąca po otrzymaniu płatności\n• Dla sprzedaży online: natychmiast lub w ciągu 3 dni\n\n**Twoje ostatnie faktury:**\n${context.recentInvoices.slice(0, 3).map((inv: any, i: number) => `${i + 1}. ${inv.number} - ${new Date(inv.issueDate).toLocaleDateString('pl-PL')} - ${inv.buyer}`).join('\n')}${contextInfo}\n\n💡 Wystawiaj faktury regularnie, aby uniknąć problemów z US!`,
        followUp: [
          'Co jeśli wystawię fakturę po terminie?',
          'Jak wystawić fakturę korygującą?',
          'Co to jest faktura pro forma?',
        ],
      }
    }

    if (lowerQuestion.includes('korekta') || lowerQuestion.includes('błąd')) {
      return {
        content: `📝 **Faktury korygujące**\n\nFakturę korygującą wystawiasz gdy:\n• Popełniłeś błąd w danych\n• Zmieniła się cena lub ilość\n• Klient zwrócił towar\n• Udzieliłeś rabatu po wystawieniu faktury\n\n**Jak to zrobić:**\n1. Wystaw fakturę korygującą w systemie BizOps\n2. Podaj numer faktury pierwotnej\n3. Opisz przyczynę korekty\n4. Wyślij do kontrahenta\n5. Poczekaj na potwierdzenie otrzymania\n\n**Ważne:**\n• Korekta "in minus" wymaga potwierdzenia od nabywcy\n• Korekta "in plus" nie wymaga potwierdzenia\n• Wpływa na rozliczenie VAT w miesiącu korekty\n\n💡 W BizOps możesz łatwo wygenerować fakturę korygującą!`,
        followUp: [
          'Co jeśli klient nie potwierdzi korekty?',
          'Czy mogę anulować fakturę?',
          'Jak korekta wpływa na VAT?',
        ],
      }
    }

    return {
      content: `📄 **Faktury - informacje ogólne**\n\n**Twoje faktury w ${new Date().getFullYear()}:**\n• Wystawionych: ${context.stats.totalInvoices}\n• W tym miesiącu: ${context.recentInvoices.length}\n• Wartość w tym miesiącu: ${stats.revenueThisMonth.toFixed(2)} zł\n\n**Obowiązkowe elementy faktury:**\n✓ Numer faktury (unikalny)\n✓ Data wystawienia i data sprzedaży\n✓ Dane sprzedawcy i nabywcy (z NIP)\n✓ Nazwa towaru/usługi\n✓ Ilość i cena netto\n✓ Stawka VAT i kwota VAT\n✓ Wartość brutto\n✓ Sposób zapłaty${contextInfo}\n\n**Przechowywanie:**\n• Faktury przechowuj przez 5 lat\n• W formie elektronicznej lub papierowej\n• Dostępne dla kontroli US\n\nCzy masz pytanie o konkretny aspekt faktur?`,
      followUp: [
        'Kiedy wystawić fakturę?',
        'Jak wystawić fakturę korygującą?',
        'Co to jest termin płatności?',
        'Czy mogę wystawiać faktury bez NIP?',
      ],
    }
  }

  // ZUS questions
  if (lowerQuestion.includes('zus') || lowerQuestion.includes('składk')) {
    const content = `🏥 **Składki ZUS dla przedsiębiorców (2025)**\n\n**Pełne składki ZUS (miesięcznie):**\n• Emerytalna: ~1,122 zł\n• Rentowa: ~368 zł\n• Chorobowa (dobrowolna): ~271 zł\n• Wypadkowa: ~73 zł\n• **Razem: ~1,834 zł** (bez chorobowej: ~1,563 zł)\n• Zdrowotna: 9% dochodu (min. ~381 zł)\n\n**Ulgi:**\n\n1. **Ulga na start (6 miesięcy):**\n   • Całkowite zwolnienie ze składek\n   • Tylko raz w życiu\n   • Automatyczne po rejestracji\n\n2. **Preferencyjne ZUS (24 miesiące):**\n   • Składki ok. 30% niższe\n   • Po okresie ulgi na start\n   • Podstawa: ok. 30% minimalnego wynagrodzenia\n\n3. **Mały ZUS Plus:**\n   • Dla przychodów do ~120,000 zł rocznie\n   • Składki proporcjonalne do dochodu\n   • Korzystne dla sezonowej działalności\n\n**Terminy:**\n• Opłata: do 10. dnia następnego miesiąca\n• Deklaracja (DRA): do 10. dnia następnego miesiąca\n\n💡 **Wskazówka:** Składkę zdrowotną można odliczyć częściowo od podatku!\n\nCzy korzystasz z jakiejś ulgi ZUS?`

    return {
      content,
      followUp: [
        'Czy mogę skorzystać z ulgi na start?',
        'Co to jest Mały ZUS Plus?',
        'Czy składka chorobowa jest obowiązkowa?',
        'Jak obliczyć składkę zdrowotną?',
      ],
    }
  }

  // Bookkeeping and record-keeping
  if (
    lowerQuestion.includes('księgow') ||
    lowerQuestion.includes('ewidencja') ||
    lowerQuestion.includes('kpir')
  ) {
    return {
      content: `📚 **Księgowość i ewidencja**\n\n**Formy rozliczeń:**\n\n1. **Księga przychodów i rozchodów (KPiR):**\n   • Dla skali podatkowej i podatku liniowego\n   • Można prowadzić samodzielnie lub przez księgowego\n   • Ewidencja przychodów i kosztów\n   • System BizOps pomaga prowadzić ewidencję!\n\n2. **Ryczałt ewidencjonowany:**\n   • Najprośniejsza forma\n   • Tylko ewidencja przychodów\n   • Nie dokumentujesz kosztów\n   • Stawki od 2% do 17%\n\n3. **Pełna księgowość:**\n   • Obowiązkowa dla spółek kapitałowych\n   • Wymaga księgowego\n   • Najbardziej szczegółowa\n\n**Co musisz przechowywać:**\n✓ Faktury sprzedaży (5 lat)\n✓ Faktury zakupu (5 lat)\n✓ Umowy z kontrahentami (5 lat)\n✓ Deklaracje podatkowe (5 lat)\n✓ Dokumenty ZUS (10 lat)\n\n**System BizOps pomaga:**\n• Automatycznie kataloguje faktury\n• Liczy VAT\n• Generuje raporty\n• Eksportuje dane dla księgowego\n\nCzy prowadzisz księgowość samodzielnie czy przez biuro?`,
      followUp: [
        'Jaka forma rozliczeń jest najlepsza dla mnie?',
        'Jak prowadzić KPiR?',
        'Czy potrzebuję księgowego?',
        'Co to jest ewidencja środków trwałych?',
      ],
    }
  }

  // Default intelligent response with conversation context
  const conversationLength = conversationHistory.length
  
  if (conversationLength < 3) {
    return {
      content: `Dzięki za pytanie! \n\n${getDefaultKnowledge(lowerQuestion)}\n\n📊 **Kontekst Twojej działalności:**\n• Przychody w ${new Date().getFullYear()}: ${stats.revenueThisYear.toFixed(2)} zł\n• Koszty: ${stats.expensesThisYear.toFixed(2)} zł\n• Zysk: ${stats.profitThisYear.toFixed(2)} zł\n• VAT do zapłaty: ${stats.vatToPayMonth.toFixed(2)} zł (ten miesiąc)\n\nCzy chciałbyś, żebym przeanalizował coś konkretnego w Twojej sytuacji?`,
      followUp: [
        'Przeanalizuj moją sytuację podatkową',
        'Ile VAT muszę zapłacić?',
        'Jak mogę zoptymalizować koszty?',
        'Ile PIT zapłacę za ten rok?',
      ],
    }
  }

  return {
    content: getDefaultKnowledge(lowerQuestion) + '\n\nCzy mogę pomóc w czymś konkretnym?',
    followUp: [
      'Przeanalizuj moją sytuację',
      'Ile VAT zapłacę?',
      'Jak zoptymalizować koszty?',
    ],
  }
}

// Default knowledge base
function getDefaultKnowledge(question: string): string {
  const q = question.toLowerCase()
  
  if (q.includes('ksef') || q.includes('elektroniczn')) {
    return '📱 **KSeF (Krajowy System e-Faktur)**\n\nObowiązkowy od 2026 roku dla wszystkich przedsiębiorców.\n\n• Faktury wystawiane przez system e-US\n• Otrzymują unikalny numer KSeF\n• Automatyczna weryfikacja\n• Uproszczone rozliczenia VAT\n• Bezpłatny dostęp 24/7\n\nWarto się przygotować już teraz!'
  }
  
  if (q.includes('amortyzacj')) {
    return '🔧 **Amortyzacja**\n\nTo stopniowe odpisywanie wartości środków trwałych jako koszt.\n\n• Dotyczy sprzętu powyżej 10,000 zł\n• Rozliczana przez kilka lat\n• Różne stawki dla różnych kategorii\n• Można wybrać metodę liniową lub degresywną\n\nPrzykład: Laptop za 12,000 zł amortyzujesz przez 2.5 roku (30 miesięcy) - miesięcznie 400 zł kosztu.'
  }
  
  if (q.includes('home office') || q.includes('biuro w domu')) {
    return '🏠 **Home Office**\n\nMożesz odliczyć koszty pracy z domu!\n\n• Do 600 zł miesięcznie\n• Proporcjonalnie do powierzchni biura\n• Potrzebujesz wydzielonego pomieszczenia\n• Odliczasz: czynsz, prąd, internet, ogrzewanie\n\nWarto skorzystać - to znaczna oszczędność!'
  }
  
  // Generic response
  return `Dziękuję za pytanie!\n\nMogę pomóc w wielu obszarach:\n\n📋 **VAT** - stawki, rozliczenia, JPK_VAT\n💰 **PIT** - formy opodatkowania, obliczenia\n📄 **Faktury** - wystawianie, korekty, KSeF\n💼 **Koszty** - co można odliczyć\n🏥 **ZUS** - składki, ulgi, terminy\n📚 **Księgowość** - prowadzenie ewidencji\n\nZadaj konkretne pytanie, a postaram się pomóc!`
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationHistory } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get financial context
    const context = await getFinancialContext(session.user.id)

    // Generate intelligent advice
    const response = generateAdvice(message, context, conversationHistory || [])

    return NextResponse.json({
      content: response.content,
      followUpQuestions: response.followUp || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Tax advisor error:', error)
    return NextResponse.json(
      { error: 'Failed to generate advice' },
      { status: 500 }
    )
  }
}


