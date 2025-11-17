/**
 * Bank Integration API - Reconcile Transactions
 * POST /api/bank/reconcile - Match transactions with invoices/expenses
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBankService } from '@/lib/services/bank-integration'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bankConnectionId } = body

    // Use any provider (reconciliation logic is the same)
    const bankService = getBankService('mbank')
    const result = await bankService.reconcileTransactions(
      session.user.id,
      bankConnectionId
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Bank reconcile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reconcile transactions' },
      { status: 500 }
    )
  }
}












