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
    
    console.log('[Settings API] Received request:', { type, data })

    // Prepare update and create objects
    let updateData: any = {}
    let createData: any = { userId: session.user.id }

    if (type === 'company') {
      const companyData = {
        companyName: data.companyName,
        companyNIP: data.companyNIP,
        companyAddress: data.companyAddress,
        companyBankAccount: data.companyBankAccount,
        companyLogo: data.companyLogo,
        bankAccounts: data.bankAccounts,
        invoiceNumbering: data.invoiceNumbering,
      }
      updateData = companyData
      createData = { ...createData, ...companyData }
    } else if (type === 'tax') {
      const taxData = {
        taxFormLabel: data.taxFormLabel,
        isVatPayer: data.isVatPayer,
        defaultVatRates: data.defaultVatRates,
        calendarTemplates: data.calendarTemplates,
        expenseCategories: data.expenseCategories,
      }
      updateData = taxData
      createData = { ...createData, ...taxData }
    } else if (type === 'appearance') {
      const appearanceData = {
        theme: data.theme,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
        layout: data.layout,
      }
      updateData = appearanceData
      createData = { ...createData, ...appearanceData }
    } else if (type === 'language') {
      const languageData = {
        locale: data.locale,
      }
      updateData = languageData
      createData = { ...createData, ...languageData }
    } else if (type === 'invoice') {
      const invoiceData = {
        showLogoOnInvoices: data.showLogoOnInvoices,
        invoiceTemplate: data.invoiceTemplate,
      }
      updateData = invoiceData
      createData = { ...createData, ...invoiceData }
    } else {
      return NextResponse.json(
        { error: 'Invalid settings type' },
        { status: 400 }
      )
    }

    console.log('[Settings API] Upserting with:', { updateData, createData })

    // Upsert settings - create if doesn't exist, update if exists
    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: createData,
    })

    console.log('[Settings API] Upsert successful:', settings.id)

    return NextResponse.json({ 
      success: true, 
      settings,
      message: 'Settings updated successfully' 
    })
  } catch (error) {
    console.error('[Settings API] Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

