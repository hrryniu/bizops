/**
 * Bank Integration API - Connect
 * POST /api/bank/connect - Initiate bank connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBankService, type BankProvider } from '@/lib/services/bank-integration'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = body as { provider: BankProvider }

    if (!provider || !['mbank', 'pko', 'bnp'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid bank provider' },
        { status: 400 }
      )
    }

    const bankService = getBankService(provider)
    const authUrl = await bankService.getAuthorizationUrl(session.user.id)

    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error('Bank connect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate bank connection' },
      { status: 500 }
    )
  }
}


