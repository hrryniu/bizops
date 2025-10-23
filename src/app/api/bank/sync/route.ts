/**
 * Bank Integration API - Sync Transactions
 * POST /api/bank/sync - Sync transactions for user's bank connections
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncAllUserBankConnections } from '@/lib/services/bank-integration'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const synced = await syncAllUserBankConnections(session.user.id)

    return NextResponse.json({
      success: true,
      transactionsSynced: synced,
    })
  } catch (error: any) {
    console.error('Bank sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}


