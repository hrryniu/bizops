import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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

    const { type, data } = await request.json()

    // Upsert settings - create if doesn't exist, update if exists
    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(type === 'company' && {
          companyName: data.companyName,
          companyNIP: data.companyNIP,
          companyAddress: data.companyAddress,
          companyBankAccount: data.companyBankAccount,
          companyLogo: data.companyLogo,
          bankAccounts: data.bankAccounts,
          invoiceNumbering: data.invoiceNumbering,
        }),
        ...(type === 'tax' && {
          taxFormLabel: data.taxFormLabel,
          isVatPayer: data.isVatPayer,
          defaultVatRates: data.defaultVatRates,
          calendarTemplates: data.calendarTemplates,
          expenseCategories: data.expenseCategories,
        }),
        ...(type === 'appearance' && {
          theme: data.theme,
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          layout: data.layout,
        }),
        ...(type === 'language' && {
          locale: data.locale,
        }),
        ...(type === 'invoice' && {
          showLogoOnInvoices: data.showLogoOnInvoices,
          invoiceTemplate: data.invoiceTemplate,
        }),
      },
      create: {
        userId: session.user.id,
        ...(type === 'company' && {
          companyName: data.companyName,
          companyNIP: data.companyNIP,
          companyAddress: data.companyAddress,
          companyBankAccount: data.companyBankAccount,
          companyLogo: data.companyLogo,
          bankAccounts: data.bankAccounts,
          invoiceNumbering: data.invoiceNumbering,
        }),
        ...(type === 'tax' && {
          taxFormLabel: data.taxFormLabel,
          isVatPayer: data.isVatPayer,
          defaultVatRates: data.defaultVatRates,
          calendarTemplates: data.calendarTemplates,
          expenseCategories: data.expenseCategories,
        }),
        ...(type === 'appearance' && {
          theme: data.theme,
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          layout: data.layout,
        }),
        ...(type === 'language' && {
          locale: data.locale,
        }),
        ...(type === 'invoice' && {
          showLogoOnInvoices: data.showLogoOnInvoices,
          invoiceTemplate: data.invoiceTemplate,
        }),
      },
    })

    return NextResponse.json({ 
      success: true, 
      settings,
      message: 'Settings updated successfully' 
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

