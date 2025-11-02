/**
 * AI Assistant API - Query
 * POST /api/ai/query - Ask AI assistant a question
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIAssistantService } from '@/lib/services/ai-assistant'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const assistant = new AIAssistantService()
    const response = await assistant.query({
      userId: session.user.id,
      query,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('AI query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process AI query' },
      { status: 500 }
    )
  }
}











