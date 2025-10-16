import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stringify } from 'csv-stringify/sync'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'invoices' or 'expenses'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!type || !['invoices', 'expenses'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const whereClause: any = { userId: session.user.id }
    
    if (startDate && endDate) {
      const dateField = type === 'invoices' ? 'issueDate' : 'date'
      whereClause[dateField] = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        where: whereClause,
        include: { buyer: true },
        orderBy: { issueDate: 'desc' },
      })

      const csvData = invoices.map(invoice => ({
        'Numer': invoice.number,
        'Data wystawienia': invoice.issueDate.toISOString().split('T')[0],
        'Data sprzedaży': invoice.saleDate?.toISOString().split('T')[0] || '',
        'Termin płatności': invoice.dueDate?.toISOString().split('T')[0] || '',
        'Nabywca': invoice.buyer?.name || '',
        'NIP nabywcy': invoice.buyer?.nip || '',
        'Status': invoice.status,
        'Metoda płatności': invoice.paymentMethod || '',
        'Netto': invoice.totalNet,
        'VAT': invoice.totalVat,
        'Brutto': invoice.totalGross,
        'Notatki': invoice.notes || '',
      }))

      const csv = stringify(csvData, {
        header: true,
        delimiter: ';',
        encoding: 'utf8',
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="faktury-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      const expenses = await prisma.expense.findMany({
        where: whereClause,
        include: { contractor: true },
        orderBy: { date: 'desc' },
      })

      const csvData = expenses.map(expense => ({
        'Data': expense.date.toISOString().split('T')[0],
        'Numer dokumentu': expense.docNumber || '',
        'Kategoria': expense.category || '',
        'Kontrahent': expense.contractor?.name || '',
        'NIP kontrahenta': expense.contractor?.nip || '',
        'Stawka VAT': expense.vatRate || '',
        'Netto': expense.netAmount,
        'VAT': expense.vatAmount,
        'Brutto': expense.grossAmount,
        'Notatki': expense.notes || '',
        'Załącznik': expense.attachmentPath ? 'Tak' : 'Nie',
      }))

      const csv = stringify(csvData, {
        header: true,
        delimiter: ';',
        encoding: 'utf8',
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="koszty-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 })
  }
}




