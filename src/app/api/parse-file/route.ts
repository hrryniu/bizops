import { NextRequest, NextResponse } from 'next/server'
import { OCRParser } from '@/lib/ocr-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    }

    // Utwórz parser na serwerze
    const parser = new OCRParser()
    
    // Parsuj plik
    const text = await parser.parseFile(file)
    
    // Wyciągnij dane w zależności od typu pliku
    const fileType = request.headers.get('x-file-type')
    const isInvoice = fileType === 'invoice' || fileType === 'application/pdf'
    const parsedData = isInvoice 
      ? parser.parseInvoiceText(text)
      : parser.parseExpenseText(text)

    return NextResponse.json({
      success: true,
      text,
      data: parsedData
    })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { 
        error: 'Błąd podczas przetwarzania pliku',
        details: error instanceof Error ? error.message : 'Nieznany błąd'
      }, 
      { status: 500 }
    )
  }
}