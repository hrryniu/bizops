/**
 * AI Assistant API - Insights
 * GET /api/ai/insights - Get AI-generated insights
 * POST /api/ai/insights - Generate new insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateUserInsights } from '@/lib/services/ai-assistant'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const insights = await prisma.aIInsight.findMany({
      where: {
        userId: session.user.id,
        isDismissed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    return NextResponse.json(insights)
  } catch (error: any) {
    console.error('AI insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get insights' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await generateUserInsights(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('AI insights generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}











