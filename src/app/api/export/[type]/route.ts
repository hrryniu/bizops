import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stringify } from 'csv-stringify/sync'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { writeFile, mkdir, readdir } from 'fs/promises'
import { join } from 'path'
import { createReadStream, createWriteStream } from 'fs'
import archiver from 'archiver'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const type = params.type

    switch (type) {
      case 'json':
        return await exportJSON(userId)
      case 'csv':
        return await exportCSV(userId)
      case 'pdf':
        return await exportPDF(userId)
      case 'zip':
        return await exportZIP(userId)
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

async function exportJSON(userId: string) {
  // Pobierz wszystkie dane użytkownika
  const data = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      contractors: true,
      invoices: {
        include: {
          buyer: true,
          items: true,
        },
      },
      expenses: {
        include: {
          contractor: true,
        },
      },
      taxEvents: true,
      projects: {
        include: {
          columns: true,
          tasks: true,
        },
      },
    },
  })

  if (!data) {
    throw new Error('User not found')
  }

  // Usuń wrażliwe dane
  const exportData = {
    ...data,
    passwordHash: undefined,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    invoices: data.invoices.map(invoice => ({
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      saleDate: invoice.saleDate?.toISOString(),
      dueDate: invoice.dueDate?.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      items: invoice.items.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    })),
    expenses: data.expenses.map(expense => ({
      ...expense,
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    })),
    taxEvents: data.taxEvents.map(event => ({
      ...event,
      dueDate: event.dueDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    })),
    projects: data.projects.map(project => ({
      ...project,
      deadline: project.deadline?.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      columns: project.columns.map(column => ({
        ...column,
        createdAt: column.createdAt.toISOString(),
        updatedAt: column.updatedAt.toISOString(),
      })),
      tasks: project.tasks.map(task => ({
        ...task,
        dueDate: task.dueDate?.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
    })),
  }

  const jsonString = JSON.stringify(exportData, null, 2)
  const filename = `bizops-export-${new Date().toISOString().split('T')[0]}.json`

  return new NextResponse(jsonString, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

async function exportCSV(userId: string) {
  // Pobierz faktury i koszty
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId },
      include: { buyer: true },
      orderBy: { issueDate: 'desc' },
    }),
    prisma.expense.findMany({
      where: { userId },
      include: { contractor: true },
      orderBy: { date: 'desc' },
    }),
  ])

  // Przygotuj dane CSV dla faktur
  const invoicesCSV = stringify([
    ['Numer', 'Data wystawienia', 'Nabywca', 'NIP', 'Netto', 'VAT', 'Brutto', 'Status'],
    ...invoices.map(invoice => [
      invoice.number,
      invoice.issueDate.toISOString().split('T')[0],
      invoice.buyer?.name || '',
      invoice.buyer?.nip || '',
      invoice.totalNet,
      invoice.totalVat,
      invoice.totalGross,
      invoice.status,
    ]),
  ])

  // Przygotuj dane CSV dla kosztów
  const expensesCSV = stringify([
    ['Data', 'Kategoria', 'Kontrahent', 'NIP', 'Netto', 'VAT', 'Brutto', 'Notatki'],
    ...expenses.map(expense => [
      expense.date.toISOString().split('T')[0],
      expense.category || '',
      expense.contractor?.name || '',
      expense.contractor?.nip || '',
      expense.netAmount,
      expense.vatAmount,
      expense.grossAmount,
      expense.notes || '',
    ]),
  ])

  const combinedCSV = `FAKTURY\n${invoicesCSV}\n\nKOSZTY\n${expensesCSV}`
  const filename = `bizops-export-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(combinedCSV, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

async function exportPDF(userId: string) {
  // Pobierz faktury
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      buyer: true,
      items: true,
      user: {
        include: {
          settings: true,
        },
      },
    },
    orderBy: { issueDate: 'desc' },
  })

  if (invoices.length === 0) {
    return NextResponse.json({ error: 'No invoices to export' }, { status: 404 })
  }

  // Utwórz folder tymczasowy
  const tempDir = join(process.cwd(), 'temp')
  try {
    await mkdir(tempDir, { recursive: true })
  } catch (error) {
    // Folder już istnieje
  }

  // Generuj PDF dla każdej faktury
  const pdfFiles: string[] = []
  for (const invoice of invoices) {
    const pdfBuffer = await generateInvoicePDF(invoice)

    const filename = `${invoice.number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    const filepath = join(tempDir, filename)
    await writeFile(filepath, pdfBuffer)
    pdfFiles.push(filepath)
  }

  // Utwórz archiwum ZIP
  const zipFilename = `bizops-faktury-${new Date().toISOString().split('T')[0]}.zip`
  const zipPath = join(tempDir, zipFilename)

  const output = createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise<NextResponse>((resolve, reject) => {
    output.on('close', async () => {
      try {
        const zipBuffer = await readFile(zipPath)
        
        // Usuń pliki tymczasowe
        for (const file of pdfFiles) {
          try {
            await unlink(file)
          } catch (error) {
            // Ignoruj błędy usuwania
          }
        }
        try {
          await unlink(zipPath)
        } catch (error) {
          // Ignoruj błędy usuwania
        }

        resolve(new NextResponse(zipBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${zipFilename}"`,
          },
        }))
      } catch (error) {
        reject(error)
      }
    })

    archive.on('error', reject)
    archive.pipe(output)

    // Dodaj pliki PDF do archiwum
    pdfFiles.forEach(file => {
      archive.file(file, { name: file.split('/').pop() })
    })

    archive.finalize()
  })
}

async function exportZIP(userId: string) {
  // Eksportuj JSON
  const jsonResponse = await exportJSON(userId)
  const jsonData = await jsonResponse.text()

  // Eksportuj PDF
  const pdfResponse = await exportPDF(userId)
  const pdfData = await pdfResponse.arrayBuffer()

  // Utwórz folder tymczasowy
  const tempDir = join(process.cwd(), 'temp')
  try {
    await mkdir(tempDir, { recursive: true })
  } catch (error) {
    // Folder już istnieje
  }

  const zipFilename = `bizops-complete-${new Date().toISOString().split('T')[0]}.zip`
  const zipPath = join(tempDir, zipFilename)

  const output = createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise<NextResponse>((resolve, reject) => {
    output.on('close', async () => {
      try {
        const zipBuffer = await readFile(zipPath)
        
        // Usuń plik tymczasowy
        try {
          await unlink(zipPath)
        } catch (error) {
          // Ignoruj błędy usuwania
        }

        resolve(new NextResponse(zipBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${zipFilename}"`,
          },
        }))
      } catch (error) {
        reject(error)
      }
    })

    archive.on('error', reject)
    archive.pipe(output)

    // Dodaj JSON
    archive.append(jsonData, { name: 'data.json' })
    
    // Dodaj PDF (jeśli istnieje)
    if (pdfData.byteLength > 0) {
      archive.append(Buffer.from(pdfData), { name: 'faktury.zip' })
    }

    archive.finalize()
  })
}

// Helper functions
async function readFile(path: string): Promise<Buffer> {
  const fs = await import('fs/promises')
  return fs.readFile(path)
}

async function unlink(path: string): Promise<void> {
  const fs = await import('fs/promises')
  return fs.unlink(path)
}
