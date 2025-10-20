import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from './utils'

// Register font for Polish characters
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyInfo: {
    flex: 1,
  },
  invoiceInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#374151',
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
    color: '#374151',
  },
  bold: {
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'solid',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 8,
  },
  tableColWide: {
    width: '30%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 8,
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsTable: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderTopWidth: 2,
    borderTopColor: '#1f2937',
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
  },
})

type InvoiceWithDetails = {
  id: string
  number: string
  issueDate: Date
  saleDate: Date | null
  dueDate: Date | null
  paymentMethod: string | null
  selectedBankAccount: string | null
  currency: string
  notes: string | null
  totalNet: string
  totalVat: string
  totalGross: string
  buyer: {
    name: string
    nip: string | null
    address: string | null
  } | null
  items: Array<{
    name: string
    quantity: string
    unit: string | null
    netPrice: string
    vatRate: string
    discount: string
    lineNet: string
    lineVat: string
    lineGross: string
  }>
  user: {
    settings: {
      companyName: string | null
      companyNIP: string | null
      companyAddress: string | null
      companyBankAccount: string | null
      bankAccounts: string | null
    } | null
  }
}

export async function generateInvoicePDF(invoice: InvoiceWithDetails, template: string = 'classic') {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  
  const { width, height } = page.getSize()
  
  // Load font that supports UTF-8
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  // Helper function to add text with proper encoding
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    // Replace Polish characters with ASCII equivalents for compatibility
    const asciiText = text
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
      .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z')
      .replace(/ż/g, 'z')
      .replace(/Ą/g, 'A').replace(/Ć/g, 'C').replace(/Ę/g, 'E').replace(/Ł/g, 'L')
      .replace(/Ń/g, 'N').replace(/Ó/g, 'O').replace(/Ś/g, 'S').replace(/Ź/g, 'Z')
      .replace(/Ż/g, 'Z')
    
    page.drawText(asciiText, {
      x,
      y: height - y,
      size: options.size || 10,
      color: options.color || rgb(0.2, 0.2, 0.2),
      font,
      ...options,
    })
  }
  
  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number, thickness: number = 1, color: any = rgb(0.8, 0.8, 0.8)) => {
    page.drawLine({
      start: { x: x1, y: height - y1 },
      end: { x: x2, y: height - y2 },
      thickness,
      color,
    })
  }
  
  // Helper function to add rectangle
  const addRect = (x: number, y: number, width: number, height: number, options: any = {}) => {
    page.drawRectangle({
      x,
      y: height - y - height,
      width,
      height,
      borderColor: options.borderColor || rgb(0.8, 0.8, 0.8),
      borderWidth: options.borderWidth || 0,
      color: options.color,
    })
  }
  
  // Get settings
  const settings = invoice.user.settings
  
  // Generate based on template
  switch (template) {
    case 'classic':
      generateClassicTemplate(page, invoice, settings, { addText, addLine, addRect, width, height, rgb, font })
      break
    case 'professional':
      generateProfessionalTemplate(page, invoice, settings, { addText, addLine, addRect, width, height, rgb, font })
      break
    case 'modern':
      generateModernTemplate(page, invoice, settings, { addText, addLine, addRect, width, height, rgb, font })
      break
    case 'minimal':
      generateMinimalTemplate(page, invoice, settings, { addText, addLine, addRect, width, height, rgb, font })
      break
    default:
      generateClassicTemplate(page, invoice, settings, { addText, addLine, addRect, width, height, rgb, font })
  }
  
  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// Classic template inspired by afaktury.pl
function generateClassicTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addLine, addRect, width, height, rgb } = helpers
  
  // Logo area (afaktury.pl style)
  addText('a', 50, 50, { size: 12, color: rgb(0, 0.66, 0.42) }) // Green 'a'
  addText('faktury.pl', 65, 50, { size: 12, color: rgb(0, 0, 0) })
  
  // Dates in top right
  addText(`Data wystawienia: ${formatDate(invoice.issueDate)}`, width - 150, 50, { size: 9 })
  if (invoice.saleDate) {
    addText(`Data sprzedazy: ${formatDate(invoice.saleDate)}`, width - 150, 65, { size: 9 })
  }
  
  // Invoice number with underline
  addText(`Faktura nr: ${invoice.number}`, 50, 100, { size: 16, color: rgb(0, 0, 0) })
  addLine(50, 110, 200, 110, 2, rgb(0, 0, 0))
  
  // Seller and buyer sections
  addText('Sprzedawca', 50, 130, { size: 10, color: rgb(0, 0, 0) })
  addLine(50, 135, 150, 135, 1, rgb(0, 0, 0))
  
  if (settings) {
    addText(settings.companyName || 'Nazwa firmy', 50, 145, { size: 9 })
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, 155, { size: 9 })
    }
    if (settings.companyNIP) {
      addText(`NIP: ${settings.companyNIP}`, 50, 165, { size: 9 })
    }
    if (settings.companyBankAccount) {
      addText(`Nr konta - ${settings.companyBankAccount}`, 50, 175, { size: 9 })
    }
  }
  
  // Vertical line separator
  addLine(150, 125, 150, 200, 1, rgb(0, 0, 0))
  
  // Buyer section
  addText('Nabywca', 160, 130, { size: 10, color: rgb(0, 0, 0) })
  addLine(160, 135, 300, 135, 1, rgb(0, 0, 0))
  
  if (invoice.buyerPrivatePerson) {
    addText(invoice.buyerPrivatePerson, 160, 145, { size: 9 })
    addText('Osoba prywatna', 160, 155, { size: 9 })
  } else if (invoice.buyer) {
    addText(invoice.buyer.name, 160, 145, { size: 9 })
    if (invoice.buyer.nip) {
      addText(`NIP: ${invoice.buyer.nip}`, 160, 155, { size: 9 })
    }
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 160, 165, { size: 9 })
    }
  }
  
  // Items table
  const tableY = 220
  addRect(50, tableY, width - 100, 20, { color: rgb(0.95, 0.95, 0.95) })
  
  addText('lp.', 60, tableY + 12, { size: 8 })
  addText('Nazwa towaru/uslugi', 80, tableY + 12, { size: 8 })
  addText('Ilosc', 200, tableY + 12, { size: 8 })
  addText('Cena netto', 250, tableY + 12, { size: 8 })
  addText('VAT', 320, tableY + 12, { size: 8 })
  addText('Kwota brutto', 380, tableY + 12, { size: 8 })
  
  addLine(50, tableY + 20, width - 50, tableY + 20, 0.5, rgb(0.8, 0.8, 0.8))
  
  // Table rows
  let currentY = tableY + 35
  invoice.items.forEach((item: any, index: number) => {
    addText((index + 1).toString(), 60, currentY, { size: 8 })
    addText(item.name, 80, currentY, { size: 8 })
    addText(`${item.quantity} ${item.unit || ''}`, 200, currentY, { size: 8 })
    addText(parseFloat(item.netPrice).toFixed(2), 250, currentY, { size: 8 })
    addText(`${item.vatRate}%`, 320, currentY, { size: 8 })
    addText(parseFloat(item.lineGross).toFixed(2), 380, currentY, { size: 8 })
    currentY += 15
  })
  
  addLine(50, currentY - 5, width - 50, currentY - 5, 0.5, rgb(0.8, 0.8, 0.8))
  
  // VAT summary table
  const vatTableY = currentY + 10
  addRect(50, vatTableY, 120, 40, { borderWidth: 0.5 })
  
  addText('Stawka VAT', 55, vatTableY + 8, { size: 7 })
  addText('Netto', 55, vatTableY + 18, { size: 7 })
  addText('VAT', 55, vatTableY + 28, { size: 7 })
  addText('Brutto', 55, vatTableY + 38, { size: 7 })
  
  addText('23%', 90, vatTableY + 8, { size: 7 })
  addText(parseFloat(invoice.totalNet).toFixed(2), 90, vatTableY + 18, { size: 7 })
  addText(parseFloat(invoice.totalVat).toFixed(2), 90, vatTableY + 28, { size: 7 })
  addText(parseFloat(invoice.totalGross).toFixed(2), 90, vatTableY + 38, { size: 7 })
  
  // Payment info
  if (invoice.paymentMethod) {
    addText(`Sposob zaplaty: ${invoice.paymentMethod}`, 50, vatTableY + 60, { size: 9 })
  }
  if (invoice.dueDate) {
    addText(`Termin zaplaty: ${formatDate(invoice.dueDate)}`, 50, vatTableY + 75, { size: 9 })
  }
  
  // Total amount
  addText(`Razem do zaplaty: ${parseFloat(invoice.totalGross).toFixed(2)} ${invoice.currency}`, 50, vatTableY + 100, { size: 12, color: rgb(0, 0, 0) })
  addLine(50, vatTableY + 110, 200, vatTableY + 110, 2, rgb(0, 0, 0))
  
  // Stamp area
  addRect(200, vatTableY + 80, 80, 30, { borderWidth: 2 })
  addText('Pieczec graficzna', 240, vatTableY + 95, { size: 8, color: rgb(0.5, 0.5, 0.5) })
}

// Professional template inspired by CargoLink
function generateProfessionalTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addLine, addRect, width, height, rgb } = helpers
  
  // Logo area (CargoLink style)
  addRect(50, 30, 15, 15, { color: rgb(0, 0.4, 0.8) }) // Blue circle
  addText('C', 57, 40, { size: 10, color: rgb(1, 1, 1) })
  addText('CARGOLINK', 70, 40, { size: 12, color: rgb(0, 0.4, 0.8) })
  
  // Invoice header
  addText('FAKTURA', width - 100, 40, { size: 14, color: rgb(0, 0, 0) })
  addText(invoice.number, width - 100, 55, { size: 10, color: rgb(0.4, 0.4, 0.4) })
  addText(`Wystawienie: ${formatDate(invoice.issueDate)}`, width - 100, 70, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  if (invoice.saleDate) {
    addText(`Wykonanie: ${formatDate(invoice.saleDate)}`, width - 100, 82, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  }
  
  // Seller section
  addText('SPRZEDAWCA', 50, 100, { size: 10, color: rgb(0, 0, 0) })
  if (settings) {
    addText(settings.companyName || 'Nazwa firmy', 50, 115, { size: 10, color: rgb(0, 0, 0) })
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, 130, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    }
    if (settings.companyNIP) {
      addText(`NIP: ${settings.companyNIP}`, 50, 145, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  // Buyer section
  addText('NABYWCA', 300, 100, { size: 10, color: rgb(0, 0, 0) })
  if (invoice.buyerPrivatePerson) {
    addText(invoice.buyerPrivatePerson, 300, 115, { size: 10, color: rgb(0, 0, 0) })
    addText('Osoba prywatna', 300, 130, { size: 9, color: rgb(0.4, 0.4, 0.4) })
  } else if (invoice.buyer) {
    addText(invoice.buyer.name, 300, 115, { size: 10, color: rgb(0, 0, 0) })
    if (invoice.buyer.nip) {
      addText(`NIP: ${invoice.buyer.nip}`, 300, 130, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    }
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 300, 145, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  // Reference numbers
  addText('sprzedawca nr ref.: REF001, REF002', 50, 170, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  addText('nabywca nr ref.: CLIENT001', 50, 182, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  
  // Items table
  const tableY = 200
  addRect(50, tableY, width - 100, 15, { color: rgb(0.95, 0.95, 0.95) })
  
  addText('#', 60, tableY + 10, { size: 8 })
  addText('Nazwa', 80, tableY + 10, { size: 8 })
  addText('Cena netto', 200, tableY + 10, { size: 8 })
  addText('Ilosc', 280, tableY + 10, { size: 8 })
  addText('j.m.', 320, tableY + 10, { size: 8 })
  addText('Razem', 380, tableY + 10, { size: 8 })
  
  addLine(50, tableY + 15, width - 50, tableY + 15, 0.5, rgb(0.8, 0.8, 0.8))
  
  // Table rows
  let currentY = tableY + 30
  invoice.items.forEach((item: any, index: number) => {
    addText((index + 1).toString(), 60, currentY, { size: 8 })
    addText(item.name, 80, currentY, { size: 8 })
    addText(parseFloat(item.netPrice).toFixed(2), 200, currentY, { size: 8 })
    addText(item.quantity.toString(), 280, currentY, { size: 8 })
    addText(item.unit || 'szt', 320, currentY, { size: 8 })
    addText(parseFloat(item.lineGross).toFixed(2), 380, currentY, { size: 8 })
    currentY += 15
  })
  
  addLine(50, currentY - 5, width - 50, currentY - 5, 0.5, rgb(0.8, 0.8, 0.8))
  
  // VAT summary
  const vatTableY = currentY + 10
  addRect(50, vatTableY, 100, 30, { borderWidth: 0.5 })
  
  addText('netto', 55, vatTableY + 8, { size: 7 })
  addText('%', 55, vatTableY + 18, { size: 7 })
  addText('VAT', 55, vatTableY + 28, { size: 7 })
  
  addText(parseFloat(invoice.totalNet).toFixed(2), 80, vatTableY + 8, { size: 7 })
  addText('23.00%', 80, vatTableY + 18, { size: 7 })
  addText(parseFloat(invoice.totalVat).toFixed(2), 80, vatTableY + 28, { size: 7 })
  
  // Total amount
  addText('NALEZNOSCI RAZEM', 200, vatTableY + 10, { size: 10, color: rgb(0, 0, 0) })
  addText(`${parseFloat(invoice.totalGross).toFixed(2)} ${invoice.currency}`, width - 100, vatTableY + 10, { size: 14, color: rgb(0, 0, 0) })
  
  if (invoice.paymentMethod) {
    addText(`metoda platnosci: ${invoice.paymentMethod}`, 200, vatTableY + 25, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  }
  if (invoice.dueDate) {
    addText(`termin platnosci: ${formatDate(invoice.dueDate)}`, 200, vatTableY + 37, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  }
  
  // Bank account
  addText('KONTA BANKOWE', 50, vatTableY + 60, { size: 9, color: rgb(0, 0, 0) })
  if (settings?.companyBankAccount) {
    addText(`PLN: ${settings.companyBankAccount}`, 50, vatTableY + 75, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  }
  
  // Notes
  if (invoice.notes) {
    addText('UWAGI', 50, vatTableY + 100, { size: 9, color: rgb(0, 0, 0) })
    addText(invoice.notes, 50, vatTableY + 115, { size: 8, color: rgb(0.8, 0, 0) })
  }
  
  // Signature lines
  addLine(50, vatTableY + 150, 150, vatTableY + 150, 1, rgb(0.6, 0.6, 0.6))
  addLine(200, vatTableY + 150, 300, vatTableY + 150, 1, rgb(0.6, 0.6, 0.6))
  addText('podpis sprzedawcy', 50, vatTableY + 160, { size: 7, color: rgb(0.4, 0.4, 0.4) })
  addText('podpis nabywcy', 200, vatTableY + 160, { size: 7, color: rgb(0.4, 0.4, 0.4) })
}

// Modern template (existing)
function generateModernTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addLine, addRect, width, height, rgb } = helpers
  
  // Modern header
  addText('FAKTURA', 50, 50, { size: 18, color: rgb(0, 0, 0) })
  addText(`NR ${invoice.number}`, 50, 70, { size: 10, color: rgb(0.4, 0.4, 0.4) })
  addText(formatDate(invoice.issueDate), width - 100, 50, { size: 9, color: rgb(0.4, 0.4, 0.4) })
  
  // Company info
  addText('WYSTAWCA', 50, 100, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  if (settings) {
    addText(settings.companyName || 'Nazwa firmy', 50, 115, { size: 10, color: rgb(0.2, 0.2, 0.2) })
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, 130, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    }
    if (settings.companyNIP) {
      addText(`NIP: ${settings.companyNIP}`, 50, 145, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  // Buyer info
  addText('ODBIORCA', 300, 100, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  if (invoice.buyerPrivatePerson) {
    addText(invoice.buyerPrivatePerson, 300, 115, { size: 10, color: rgb(0.2, 0.2, 0.2) })
    addText('Osoba prywatna', 300, 130, { size: 9, color: rgb(0.4, 0.4, 0.4) })
  } else if (invoice.buyer) {
    addText(invoice.buyer.name, 300, 115, { size: 10, color: rgb(0.2, 0.2, 0.2) })
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 300, 130, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  addLine(50, 160, width - 50, 160, 1, rgb(0.9, 0.9, 0.9))
  
  // Items table
  const tableY = 180
  addText('POZYCJA', 50, tableY, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  addText('NETTO', width - 150, tableY, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  addText('VAT', width - 100, tableY, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  addText('BRUTTO', width - 50, tableY, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  
  // Table rows
  let currentY = tableY + 20
  invoice.items.forEach((item: any, index: number) => {
    const bgColor = index % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1)
    addRect(50, currentY - 5, width - 100, 15, { color: bgColor })
    
    addText(item.name, 60, currentY, { size: 9, color: rgb(0.2, 0.2, 0.2) })
    addText(parseFloat(item.lineNet).toFixed(2), width - 150, currentY, { size: 9, color: rgb(0.3, 0.3, 0.3) })
    addText(parseFloat(item.lineVat).toFixed(2), width - 100, currentY, { size: 9, color: rgb(0.3, 0.3, 0.3) })
    addText(parseFloat(item.lineGross).toFixed(2), width - 50, currentY, { size: 9, color: rgb(0.2, 0.2, 0.2) })
    currentY += 15
  })
  
  addLine(50, currentY - 5, width - 50, currentY - 5, 1, rgb(0.9, 0.9, 0.9))
  
  // Total
  addText('SUMA KONCOWA:', width/2, currentY + 20, { size: 10, color: rgb(0.2, 0.2, 0.2) })
  addText(`${parseFloat(invoice.totalGross).toFixed(2)} ${invoice.currency}`, width - 50, currentY + 20, { size: 14, color: rgb(0, 0, 0) })
  
  // Payment info
  if (invoice.dueDate) {
    addText(`Zaplac do: ${formatDate(invoice.dueDate)}`, 50, currentY + 50, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  }
  if (invoice.paymentMethod) {
    addText(`Forma platnosci: ${invoice.paymentMethod}`, 50, currentY + 65, { size: 8, color: rgb(0.6, 0.6, 0.6) })
  }
}

// Minimal template (existing)
function generateMinimalTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addLine, addRect, width, height, rgb } = helpers
  
  // Minimal header
  addText(`Faktura ${invoice.number}`, 50, 50, { size: 12, color: rgb(0.2, 0.2, 0.2) })
  addText(`Data wystawienia: ${formatDate(invoice.issueDate)}`, 50, 70, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  if (invoice.dueDate) {
    addText(`Termin: ${formatDate(invoice.dueDate)}`, width - 100, 70, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  }
  
  // Company info
  addText('Od:', 50, 100, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  if (settings) {
    addText(settings.companyName || 'Nazwa firmy', 50, 115, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, 130, { size: 8, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  // Buyer info
  addText('Dla:', 300, 100, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  if (invoice.buyerPrivatePerson) {
    addText(invoice.buyerPrivatePerson, 300, 115, { size: 9, color: rgb(0.4, 0.4, 0.4) })
  } else if (invoice.buyer) {
    addText(invoice.buyer.name, 300, 115, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 300, 130, { size: 8, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  // Items table
  const tableY = 160
  addRect(50, tableY, width - 100, 12, { color: rgb(0.95, 0.95, 0.95) })
  
  addText('Opis', 60, tableY + 8, { size: 7 })
  addText('Kwota', width - 100, tableY + 8, { size: 7 })
  
  // Table rows
  let currentY = tableY + 20
  invoice.items.forEach((item: any) => {
    addText(item.name, 60, currentY, { size: 8, color: rgb(0.3, 0.3, 0.3) })
    addText(parseFloat(item.lineGross).toFixed(2), width - 100, currentY, { size: 8, color: rgb(0.3, 0.3, 0.3) })
    currentY += 12
  })
  
  addLine(50, currentY - 5, width - 50, currentY - 5, 0.5, rgb(0.8, 0.8, 0.8))
  
  // Totals
  addText('Suma netto:', 60, currentY + 15, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  addText(`${parseFloat(invoice.totalNet).toFixed(2)}`, width - 100, currentY + 15, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  
  addText('VAT 23%:', 60, currentY + 30, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  addText(`${parseFloat(invoice.totalVat).toFixed(2)}`, width - 100, currentY + 30, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  
  addText('Do zaplaty:', 60, currentY + 50, { size: 10, color: rgb(0, 0, 0) })
  addText(`${parseFloat(invoice.totalGross).toFixed(2)} ${invoice.currency}`, width - 100, currentY + 50, { size: 10, color: rgb(0, 0, 0) })
  
  // Bank account
  if (settings?.companyBankAccount) {
    addText(`Numer konta: ${settings.companyBankAccount}`, 50, currentY + 80, { size: 7, color: rgb(0.6, 0.6, 0.6) })
  }
}