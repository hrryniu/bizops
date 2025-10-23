/**
 * Bank Integration API - OAuth Callback
 * GET /api/bank/callback - Handle OAuth callback from bank
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBankService, type BankProvider } from '@/lib/services/bank-integration'
import { decrypt } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const provider = searchParams.get('provider') as BankProvider

    if (!code || !state || !provider) {
      return NextResponse.redirect(new URL('/banking?error=invalid_callback', request.url))
    }

    // Decode state to get userId
    const [userId] = decrypt(state).split(':')

    const bankService = getBankService(provider)

    // Exchange code for tokens
    const authResponse = await bankService.exchangeAuthorizationCode(code)

    // Get account information
    const accounts = await bankService.getAccounts(authResponse.accessToken)

    if (accounts.length === 0) {
      return NextResponse.redirect(new URL('/banking?error=no_accounts', request.url))
    }

    // Save first account (user can add more later)
    const account = accounts[0]
    await bankService.saveBankConnection(
      userId,
      account.accountName,
      account.accountNumber,
      authResponse
    )

    return NextResponse.redirect(new URL('/banking?success=true', request.url))
  } catch (error: any) {
    console.error('Bank callback error:', error)
    return NextResponse.redirect(
      new URL(`/banking?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}


