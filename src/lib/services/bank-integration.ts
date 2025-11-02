/**
 * 🏦 Bank API Integration Service
 * 
 * Implements PSD2 Open Banking integration for Polish banks:
 * - mBank, PKO BP, BNP Paribas
 * - OAuth2 authentication flow
 * - Transaction synchronization
 * - Automatic payment reconciliation
 */

import axios, { AxiosInstance } from 'axios'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/encryption'
import { BANK_CONFIG, APP_CONFIG } from '@/lib/config'

// ========================================
// Types
// ========================================

export type BankProvider = 'mbank' | 'pko' | 'bnp'

export interface BankAuthResponse {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  consentId?: string
  consentExpiresAt?: Date
}

export interface BankTransaction {
  transactionId: string
  date: Date
  amount: number
  currency: string
  counterpartyName?: string
  counterpartyAccount?: string
  title?: string
  description?: string
  type: 'DEBIT' | 'CREDIT'
}

export interface BankAccount {
  accountNumber: string
  accountName: string
  currency: string
  balance?: number
}

export interface ReconciliationResult {
  matched: number
  unmatched: number
  invoicesPaid: number
  details: Array<{
    transactionId: string
    matchedWith?: string
    matchedType?: 'INVOICE' | 'EXPENSE'
    confidence: number
  }>
}

// ========================================
// Bank Integration Service
// ========================================

export class BankIntegrationService {
  private provider: BankProvider
  private client: AxiosInstance

  constructor(provider: BankProvider) {
    this.provider = provider
    const config = this.getBankConfig()
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
  }

  /**
   * Get bank-specific configuration
   */
  private getBankConfig() {
    const configs = {
      mbank: BANK_CONFIG.mbank,
      pko: BANK_CONFIG.pko,
      bnp: BANK_CONFIG.bnp,
    }
    return configs[this.provider]
  }

  /**
   * Step 1: Get authorization URL for user consent (PSD2)
   */
  async getAuthorizationUrl(userId: string): Promise<string> {
    const config = this.getBankConfig()
    const state = encrypt(`${userId}:${Date.now()}`)
    
    // Build OAuth2 authorization URL according to PSD2 standards
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: BANK_CONFIG.psd2.redirectUri,
      scope: 'accounts transactions', // PSD2 scopes
      state,
      consent_validity: BANK_CONFIG.psd2.consentDays.toString(),
    })

    return `${config.apiUrl}/oauth2/authorize?${params.toString()}`
  }

  /**
   * Step 2: Exchange authorization code for access token
   */
  async exchangeAuthorizationCode(code: string): Promise<BankAuthResponse> {
    if (APP_CONFIG.mock.bankApi) {
      return this.mockAuthResponse()
    }

    const config = this.getBankConfig()

    try {
      const response = await this.client.post('/oauth2/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: BANK_CONFIG.psd2.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      })

      const data = response.data
      const consentExpiresAt = new Date()
      consentExpiresAt.setDate(consentExpiresAt.getDate() + BANK_CONFIG.psd2.consentDays)

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        consentId: data.consent_id,
        consentExpiresAt,
      }
    } catch (error: any) {
      console.error('Failed to exchange authorization code:', error.response?.data || error.message)
      throw new Error('Failed to authenticate with bank')
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<BankAuthResponse> {
    if (APP_CONFIG.mock.bankApi) {
      return this.mockAuthResponse()
    }

    const config = this.getBankConfig()

    try {
      const response = await this.client.post('/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      })

      const data = response.data

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
      }
    } catch (error: any) {
      console.error('Failed to refresh token:', error.response?.data || error.message)
      throw new Error('Failed to refresh bank token')
    }
  }

  /**
   * Fetch bank accounts
   */
  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    if (APP_CONFIG.mock.bankApi) {
      return this.mockAccounts()
    }

    try {
      const response = await this.client.get('/accounts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return response.data.accounts.map((acc: any) => ({
        accountNumber: acc.iban || acc.account_number,
        accountName: acc.name || acc.product,
        currency: acc.currency || 'PLN',
        balance: acc.balance?.amount,
      }))
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error.response?.data || error.message)
      throw new Error('Failed to fetch bank accounts')
    }
  }

  /**
   * Fetch transactions for a specific account
   */
  async getTransactions(
    accessToken: string,
    accountNumber: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<BankTransaction[]> {
    if (APP_CONFIG.mock.bankApi) {
      return this.mockTransactions()
    }

    try {
      const params: any = {
        account_id: accountNumber,
      }

      if (dateFrom) {
        params.date_from = dateFrom.toISOString().split('T')[0]
      }
      if (dateTo) {
        params.date_to = dateTo.toISOString().split('T')[0]
      }

      const response = await this.client.get('/transactions', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      })

      return response.data.transactions.map((txn: any) => ({
        transactionId: txn.transaction_id || txn.id,
        date: new Date(txn.booking_date || txn.date),
        amount: Math.abs(parseFloat(txn.amount)),
        currency: txn.currency || 'PLN',
        counterpartyName: txn.creditor_name || txn.debtor_name || txn.counterparty,
        counterpartyAccount: txn.creditor_account || txn.debtor_account,
        title: txn.remittance_information || txn.title,
        description: txn.additional_information || txn.description,
        type: parseFloat(txn.amount) > 0 ? 'CREDIT' : 'DEBIT',
      }))
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error.response?.data || error.message)
      throw new Error('Failed to fetch transactions')
    }
  }

  /**
   * Save bank connection to database
   */
  async saveBankConnection(
    userId: string,
    accountName: string,
    accountNumber: string,
    authResponse: BankAuthResponse
  ) {
    return await prisma.bankConnection.create({
      data: {
        userId,
        bankName: this.provider.toUpperCase(),
        accountName,
        accountNumber: encrypt(accountNumber),
        accessToken: encrypt(authResponse.accessToken),
        refreshToken: authResponse.refreshToken ? encrypt(authResponse.refreshToken) : null,
        tokenExpiresAt: new Date(Date.now() + authResponse.expiresIn * 1000),
        consentId: authResponse.consentId,
        consentExpiresAt: authResponse.consentExpiresAt,
        isActive: true,
      },
    })
  }

  /**
   * Sync transactions for a bank connection
   */
  async syncTransactions(bankConnectionId: string): Promise<number> {
    const connection = await prisma.bankConnection.findUnique({
      where: { id: bankConnectionId },
    })

    if (!connection || !connection.isActive) {
      throw new Error('Bank connection not found or inactive')
    }

    // Check if token needs refresh
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      if (!connection.refreshToken) {
        throw new Error('Token expired and no refresh token available')
      }

      const refreshed = await this.refreshAccessToken(decrypt(connection.refreshToken))
      
      await prisma.bankConnection.update({
        where: { id: bankConnectionId },
        data: {
          accessToken: encrypt(refreshed.accessToken),
          refreshToken: refreshed.refreshToken ? encrypt(refreshed.refreshToken) : connection.refreshToken,
          tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
        },
      })

      connection.accessToken = encrypt(refreshed.accessToken)
    }

    const accessToken = decrypt(connection.accessToken!)
    const accountNumber = decrypt(connection.accountNumber)

    // Fetch transactions from last sync or last 90 days
    const dateFrom = connection.lastSyncedAt || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const transactions = await this.getTransactions(accessToken, accountNumber, dateFrom)

    let savedCount = 0

    // Save new transactions to database
    for (const txn of transactions) {
      const existing = await prisma.bankTransaction.findUnique({
        where: { transactionId: txn.transactionId },
      })

      if (!existing) {
        await prisma.bankTransaction.create({
          data: {
            bankConnectionId,
            transactionId: txn.transactionId,
            date: txn.date,
            amount: txn.amount,
            currency: txn.currency,
            counterpartyName: txn.counterpartyName,
            counterpartyAccount: txn.counterpartyAccount,
            title: txn.title,
            description: txn.description,
            type: txn.type,
            category: this.categorizeTransaction(txn),
          },
        })
        savedCount++
      }
    }

    // Update last synced timestamp
    await prisma.bankConnection.update({
      where: { id: bankConnectionId },
      data: { lastSyncedAt: new Date() },
    })

    return savedCount
  }

  /**
   * Auto-categorize transaction based on title/description
   */
  private categorizeTransaction(txn: BankTransaction): string | null {
    const text = `${txn.title} ${txn.description}`.toLowerCase()

    if (text.includes('zus') || text.includes('ubezpieczenie')) return 'ZUS'
    if (text.includes('us') || text.includes('podatek')) return 'PODATEK'
    if (text.includes('faktura') || text.includes('fv')) return 'FAKTURA'
    if (text.includes('przelew') && txn.type === 'CREDIT') return 'PRZYCHÓD'
    if (text.includes('paliwo') || text.includes('benzyna')) return 'TRANSPORT'
    if (text.includes('biuro') || text.includes('wynajem')) return 'BIURO'

    return null
  }

  /**
   * Reconcile transactions with invoices and expenses
   */
  async reconcileTransactions(
    userId: string,
    bankConnectionId?: string
  ): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      matched: 0,
      unmatched: 0,
      invoicesPaid: 0,
      details: [],
    }

    // Get unreconciled transactions
    const where: any = { isReconciled: false }
    if (bankConnectionId) {
      where.bankConnectionId = bankConnectionId
    } else {
      where.bankConnection = { userId }
    }

    const transactions = await prisma.bankTransaction.findMany({
      where,
      include: { bankConnection: true },
    })

    for (const txn of transactions) {
      let matched = false
      let matchedWith: string | undefined
      let matchedType: 'INVOICE' | 'EXPENSE' | undefined

      // Try to match with invoices (incoming payments)
      if (txn.type === 'CREDIT') {
        const invoice = await this.matchTransactionToInvoice(userId, txn)
        if (invoice) {
          await prisma.bankTransaction.update({
            where: { id: txn.id },
            data: {
              isReconciled: true,
              reconciledWith: invoice.id,
              reconciledType: 'INVOICE',
            },
          })

          // Mark invoice as PAID
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID' },
          })

          matched = true
          matchedWith = invoice.id
          matchedType = 'INVOICE'
          result.invoicesPaid++
        }
      }

      // Try to match with expenses (outgoing payments)
      if (txn.type === 'DEBIT' && !matched) {
        const expense = await this.matchTransactionToExpense(userId, txn)
        if (expense) {
          await prisma.bankTransaction.update({
            where: { id: txn.id },
            data: {
              isReconciled: true,
              reconciledWith: expense.id,
              reconciledType: 'EXPENSE',
            },
          })

          matched = true
          matchedWith = expense.id
          matchedType = 'EXPENSE'
        }
      }

      if (matched) {
        result.matched++
      } else {
        result.unmatched++
      }

      result.details.push({
        transactionId: txn.transactionId,
        matchedWith,
        matchedType,
        confidence: matched ? 0.9 : 0,
      })
    }

    return result
  }

  /**
   * Match transaction to invoice
   */
  private async matchTransactionToInvoice(userId: string, txn: any) {
    // Find invoices with matching amount and approximate date
    const dateStart = new Date(txn.date)
    dateStart.setDate(dateStart.getDate() - 7) // 7 days before
    const dateEnd = new Date(txn.date)
    dateEnd.setDate(dateEnd.getDate() + 7) // 7 days after

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'ISSUED',
        totalGross: txn.amount,
        issueDate: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
    })

    if (invoices.length === 1) {
      return invoices[0]
    }

    // Try fuzzy matching by invoice number in transaction title
    for (const invoice of invoices) {
      if (txn.title?.includes(invoice.number)) {
        return invoice
      }
    }

    return null
  }

  /**
   * Match transaction to expense
   */
  private async matchTransactionToExpense(userId: string, txn: any) {
    // Find expenses with matching amount and approximate date
    const dateStart = new Date(txn.date)
    dateStart.setDate(dateStart.getDate() - 7)
    const dateEnd = new Date(txn.date)
    dateEnd.setDate(dateEnd.getDate() + 7)

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        grossAmount: txn.amount,
        date: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
    })

    if (expenses.length === 1) {
      return expenses[0]
    }

    // Try fuzzy matching by contractor name or document number
    for (const expense of expenses) {
      if (
        (expense.contractorName && txn.counterpartyName?.includes(expense.contractorName)) ||
        (expense.docNumber && txn.title?.includes(expense.docNumber))
      ) {
        return expense
      }
    }

    return null
  }

  // ========================================
  // Mock Data for Testing
  // ========================================

  private mockAuthResponse(): BankAuthResponse {
    return {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token',
      expiresIn: 3600,
      consentId: 'mock_consent_id',
      consentExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    }
  }

  private mockAccounts(): BankAccount[] {
    return [
      {
        accountNumber: 'PL12345678901234567890123456',
        accountName: 'Konto firmowe',
        currency: 'PLN',
        balance: 15420.50,
      },
    ]
  }

  private mockTransactions(): BankTransaction[] {
    const now = new Date()
    return [
      {
        transactionId: 'TXN001',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        amount: 2500.00,
        currency: 'PLN',
        counterpartyName: 'Jan Kowalski',
        counterpartyAccount: 'PL98765432109876543210987654',
        title: 'Faktura FV/01/2025',
        type: 'CREDIT',
      },
      {
        transactionId: 'TXN002',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        amount: 1842.33,
        currency: 'PLN',
        counterpartyName: 'ZUS',
        title: 'Składki ZUS - styczeń 2025',
        type: 'DEBIT',
      },
    ]
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get or create bank integration service for a provider
 */
export function getBankService(provider: BankProvider): BankIntegrationService {
  return new BankIntegrationService(provider)
}

/**
 * Sync all active bank connections for a user
 */
export async function syncAllUserBankConnections(userId: string): Promise<number> {
  const connections = await prisma.bankConnection.findMany({
    where: {
      userId,
      isActive: true,
    },
  })

  let totalSynced = 0

  for (const connection of connections) {
    try {
      const provider = connection.bankName.toLowerCase() as BankProvider
      const service = getBankService(provider)
      const count = await service.syncTransactions(connection.id)
      totalSynced += count
    } catch (error) {
      console.error(`Failed to sync connection ${connection.id}:`, error)
    }
  }

  return totalSynced
}








