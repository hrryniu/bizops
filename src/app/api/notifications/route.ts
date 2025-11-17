/**
 * Notifications API
 * GET /api/notifications - Get user notifications
 * POST /api/notifications/mark-read - Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getNotificationSummary, NotificationService } from '@/lib/services/notification-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await getNotificationSummary(session.user.id)

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get notifications' },
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

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 })
    }

    const service = new NotificationService()
    await service.markAsRead(notificationId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notification mark read error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}












