import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'invoices', 'expenses', or 'all'

    const exportData: any = {
      exportDate: new Date().toISOString(),
      userId: session.user.id,
    }

    if (type === 'all' || type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        where: { userId: session.user.id },
        include: { 
          buyer: true,
          items: true,
        },
        orderBy: { issueDate: 'desc' },
      })
      exportData.invoices = invoices
    }

    if (type === 'all' || type === 'expenses') {
      const expenses = await prisma.expense.findMany({
        where: { userId: session.user.id },
        include: { contractor: true },
        orderBy: { date: 'desc' },
      })
      exportData.expenses = expenses
    }

    if (type === 'all') {
      const contractors = await prisma.contractor.findMany({
        where: { userId: session.user.id },
        orderBy: { name: 'asc' },
      })
      exportData.contractors = contractors

      const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        include: {
          columns: {
            include: {
              tasks: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
      exportData.projects = projects

      const taxEvents = await prisma.taxEvent.findMany({
        where: { userId: session.user.id },
        orderBy: { dueDate: 'asc' },
      })
      exportData.taxEvents = taxEvents

      const settings = await prisma.settings.findUnique({
        where: { userId: session.user.id },
      })
      exportData.settings = settings
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="bizops-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('JSON export error:', error)
    return NextResponse.json({ error: 'Failed to export JSON' }, { status: 500 })
  }
}




