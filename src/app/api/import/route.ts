import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Sprawdź typ pliku
    if (file.type !== 'application/json') {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Przeczytaj plik
    const text = await file.text()
    let importData: any

    try {
      importData = JSON.parse(text)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 })
    }

    // Waliduj strukturę danych
    if (!importData.id || !importData.email) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const userId = session.user.id
    let importCount = 0

    // Rozpocznij transakcję
    await prisma.$transaction(async (tx) => {
      // Usuń istniejące dane użytkownika (oprócz użytkownika i ustawień)
      await tx.contractor.deleteMany({ where: { userId } })
      await tx.invoiceItem.deleteMany({ 
        where: { 
          invoice: { userId } 
        } 
      })
      await tx.invoice.deleteMany({ where: { userId } })
      await tx.expense.deleteMany({ where: { userId } })
      await tx.taxEvent.deleteMany({ where: { userId } })
      await tx.task.deleteMany({ 
        where: { 
          project: { userId } 
        } 
      })
      await tx.kanbanColumn.deleteMany({ 
        where: { 
          project: { userId } 
        } 
      })
      await tx.project.deleteMany({ where: { userId } })

      // Importuj kontrahentów
      if (importData.contractors && Array.isArray(importData.contractors)) {
        for (const contractor of importData.contractors) {
          await tx.contractor.create({
            data: {
              id: contractor.id,
              userId,
              name: contractor.name,
              nip: contractor.nip,
              address: contractor.address,
              email: contractor.email,
              phone: contractor.phone,
              notes: contractor.notes,
              createdAt: new Date(contractor.createdAt),
              updatedAt: new Date(contractor.updatedAt),
            },
          })
          importCount++
        }
      }

      // Importuj faktury
      if (importData.invoices && Array.isArray(importData.invoices)) {
        for (const invoice of importData.invoices) {
          const createdInvoice = await tx.invoice.create({
            data: {
              id: invoice.id,
              userId,
              number: invoice.number,
              issueDate: new Date(invoice.issueDate),
              saleDate: invoice.saleDate ? new Date(invoice.saleDate) : null,
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
              paymentMethod: invoice.paymentMethod,
              buyerId: invoice.buyerId,
              status: invoice.status,
              currency: invoice.currency,
              notes: invoice.notes,
              totalNet: invoice.totalNet,
              totalVat: invoice.totalVat,
              totalGross: invoice.totalGross,
              createdAt: new Date(invoice.createdAt),
              updatedAt: new Date(invoice.updatedAt),
            },
          })

          // Importuj pozycje faktury
          if (invoice.items && Array.isArray(invoice.items)) {
            for (const item of invoice.items) {
              await tx.invoiceItem.create({
                data: {
                  id: item.id,
                  invoiceId: createdInvoice.id,
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  netPrice: item.netPrice,
                  vatRate: item.vatRate,
                  discount: item.discount,
                  lineNet: item.lineNet,
                  lineVat: item.lineVat,
                  lineGross: item.lineGross,
                  createdAt: new Date(item.createdAt),
                  updatedAt: new Date(item.updatedAt),
                },
              })
            }
          }
          importCount++
        }
      }

      // Importuj koszty
      if (importData.expenses && Array.isArray(importData.expenses)) {
        for (const expense of importData.expenses) {
          await tx.expense.create({
            data: {
              id: expense.id,
              userId,
              contractorId: expense.contractorId,
              docNumber: expense.docNumber,
              date: new Date(expense.date),
              category: expense.category,
              vatRate: expense.vatRate,
              netAmount: expense.netAmount,
              vatAmount: expense.vatAmount,
              grossAmount: expense.grossAmount,
              notes: expense.notes,
              attachmentPath: expense.attachmentPath,
              createdAt: new Date(expense.createdAt),
              updatedAt: new Date(expense.updatedAt),
            },
          })
          importCount++
        }
      }

      // Importuj zdarzenia podatkowe
      if (importData.taxEvents && Array.isArray(importData.taxEvents)) {
        for (const event of importData.taxEvents) {
          await tx.taxEvent.create({
            data: {
              id: event.id,
              userId,
              templateKey: event.templateKey,
              title: event.title,
              description: event.description,
              dueDate: new Date(event.dueDate),
              status: event.status,
              relatedUrl: event.relatedUrl,
              createdAt: new Date(event.createdAt),
              updatedAt: new Date(event.updatedAt),
            },
          })
          importCount++
        }
      }

      // Importuj projekty
      if (importData.projects && Array.isArray(importData.projects)) {
        for (const project of importData.projects) {
          const createdProject = await tx.project.create({
            data: {
              id: project.id,
              userId,
              name: project.name,
              slug: project.slug,
              color: project.color,
              icon: project.icon,
              imagePath: project.imagePath,
              description: project.description,
              deadline: project.deadline ? new Date(project.deadline) : null,
              priority: project.priority,
              status: project.status,
              notesMd: project.notesMd,
              createdAt: new Date(project.createdAt),
              updatedAt: new Date(project.updatedAt),
            },
          })

          // Importuj kolumny Kanban
          if (project.columns && Array.isArray(project.columns)) {
            for (const column of project.columns) {
              await tx.kanbanColumn.create({
                data: {
                  id: column.id,
                  projectId: createdProject.id,
                  name: column.name,
                  order: column.order,
                  createdAt: new Date(column.createdAt),
                  updatedAt: new Date(column.updatedAt),
                },
              })
            }
          }

          // Importuj zadania
          if (project.tasks && Array.isArray(project.tasks)) {
            for (const task of project.tasks) {
              await tx.task.create({
                data: {
                  id: task.id,
                  projectId: createdProject.id,
                  columnId: task.columnId,
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  dueDate: task.dueDate ? new Date(task.dueDate) : null,
                  tags: task.tags,
                  checklist: task.checklist,
                  attachments: task.attachments,
                  status: task.status,
                  createdAt: new Date(task.createdAt),
                  updatedAt: new Date(task.updatedAt),
                },
              })
            }
          }
          importCount++
        }
      }

      // Aktualizuj ustawienia
      if (importData.settings) {
        await tx.settings.upsert({
          where: { userId },
          update: {
            companyName: importData.settings.companyName,
            companyNIP: importData.settings.companyNIP,
            companyAddress: importData.settings.companyAddress,
            companyBankAccount: importData.settings.companyBankAccount,
            companyLogo: importData.settings.companyLogo,
            invoiceNumbering: importData.settings.invoiceNumbering,
            taxFormLabel: importData.settings.taxFormLabel,
            defaultVatRates: importData.settings.defaultVatRates,
            calendarTemplates: importData.settings.calendarTemplates,
            locale: importData.settings.locale,
            darkMode: importData.settings.darkMode,
            updatedAt: new Date(),
          },
          create: {
            userId,
            companyName: importData.settings.companyName,
            companyNIP: importData.settings.companyNIP,
            companyAddress: importData.settings.companyAddress,
            companyBankAccount: importData.settings.companyBankAccount,
            companyLogo: importData.settings.companyLogo,
            invoiceNumbering: importData.settings.invoiceNumbering,
            taxFormLabel: importData.settings.taxFormLabel,
            defaultVatRates: importData.settings.defaultVatRates,
            calendarTemplates: importData.settings.calendarTemplates,
            locale: importData.settings.locale,
            darkMode: importData.settings.darkMode,
          },
        })
      }
    })

    return NextResponse.json({ 
      success: true, 
      count: importCount,
      message: `Zaimportowano ${importCount} rekordów` 
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
