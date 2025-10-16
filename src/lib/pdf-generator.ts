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

export async function generateInvoicePDF(invoice: InvoiceWithDetails) {
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
      color: rgb(0.2, 0.2, 0.2),
      font,
      ...options,
    })
  }
  
  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({
      start: { x: x1, y: height - y1 },
      end: { x: x2, y: height - y2 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
  }
  
  // Header
  addText('FAKTURA VAT', 50, 50, { size: 24, color: rgb(0.1, 0.1, 0.1) })
  addText(`Nr ${invoice.number}`, width - 150, 50, { size: 14 })
  
  // Company info
  const settings = invoice.user.settings
  if (settings) {
    addText(settings.companyName || 'Firma', 50, 100, { size: 12 })
    if (settings.companyNIP) {
      addText(`NIP: ${settings.companyNIP}`, 50, 115)
    }
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, 130)
    }
    
    // Display selected bank account or default one
    let bankAccountToShow = null
    if (invoice.selectedBankAccount && settings.bankAccounts) {
      try {
        const bankAccounts = JSON.parse(settings.bankAccounts)
        const selectedAccount = bankAccounts.find((acc: any) => acc.name === invoice.selectedBankAccount)
        if (selectedAccount) {
          bankAccountToShow = `${selectedAccount.name}: ${selectedAccount.accountNumber}`
        }
      } catch (error) {
        console.error('Error parsing bank accounts:', error)
      }
    }
    
    // Fallback to legacy single bank account
    if (!bankAccountToShow && settings.companyBankAccount) {
      bankAccountToShow = settings.companyBankAccount
    }
    
    if (bankAccountToShow) {
      addText(`Konto: ${bankAccountToShow}`, 50, 145)
    }
  }
  
  // Buyer info
  if (invoice.buyerPrivatePerson) {
    addText('Nabywca:', 300, 100, { size: 12 })
    addText(invoice.buyerPrivatePerson, 300, 115)
    addText('Osoba prywatna', 300, 130, { size: 9 })
  } else if (invoice.buyer) {
    addText('Nabywca:', 300, 100, { size: 12 })
    addText(invoice.buyer.name, 300, 115)
    if (invoice.buyer.nip) {
      addText(`NIP: ${invoice.buyer.nip}`, 300, 130)
    }
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 300, 145)
    }
  }
  
  // Invoice details
  addText('Data wystawienia:', 50, 200)
  addText(formatDate(invoice.issueDate), 150, 200)
  
  if (invoice.saleDate) {
    addText('Data sprzedaży:', 50, 215)
    addText(formatDate(invoice.saleDate), 150, 215)
  }
  
  if (invoice.dueDate) {
    addText('Termin płatności:', 50, 230)
    addText(formatDate(invoice.dueDate), 150, 230)
  }
  
  if (invoice.paymentMethod) {
    addText('Metoda płatności:', 50, 245)
    addText(invoice.paymentMethod, 150, 245)
  }
  
  // Table header
  const tableY = 300
  addLine(50, tableY, width - 50, tableY)
  
  addText('Lp.', 60, tableY + 20, { size: 9 })
  addText('Nazwa towaru/usługi', 100, tableY + 20, { size: 9 })
  addText('Ilość', 300, tableY + 20, { size: 9 })
  addText('Cena netto', 350, tableY + 20, { size: 9 })
  addText('VAT', 420, tableY + 20, { size: 9 })
  addText('Wartość netto', 480, tableY + 20, { size: 9 })
  addText('Wartość brutto', 540, tableY + 20, { size: 9 })
  
  addLine(50, tableY + 40, width - 50, tableY + 40)
  
  // Table rows
  let currentY = tableY + 60
  invoice.items.forEach((item, index) => {
    addText((index + 1).toString(), 60, currentY, { size: 8 })
    addText(item.name, 100, currentY, { size: 8 })
    addText(`${item.quantity} ${item.unit || ''}`, 300, currentY, { size: 8 })
    addText(parseFloat(item.netPrice).toFixed(2), 350, currentY, { size: 8 })
    addText(`${item.vatRate}%`, 420, currentY, { size: 8 })
    addText(parseFloat(item.lineNet).toFixed(2), 480, currentY, { size: 8 })
    addText(parseFloat(item.lineGross).toFixed(2), 540, currentY, { size: 8 })
    
    currentY += 20
  })
  
  addLine(50, currentY, width - 50, currentY)
  
  // Totals
  currentY += 30
  addText('Razem netto:', 400, currentY, { size: 10 })
  addText(parseFloat(invoice.totalNet).toFixed(2), 500, currentY, { size: 10 })
  
  currentY += 20
  addText('VAT:', 400, currentY, { size: 10 })
  addText(parseFloat(invoice.totalVat).toFixed(2), 500, currentY, { size: 10 })
  
  currentY += 20
  addLine(400, currentY - 10, width - 50, currentY - 10)
  addText('Razem brutto:', 400, currentY, { size: 12, color: rgb(0.1, 0.1, 0.1) })
  addText(parseFloat(invoice.totalGross).toFixed(2), 500, currentY, { size: 12, color: rgb(0.1, 0.1, 0.1) })
  
  // Notes
  if (invoice.notes) {
    currentY += 40
    addText('Uwagi:', 50, currentY, { size: 10 })
    addText(invoice.notes, 50, currentY + 20, { size: 9 })
  }
  
  // Footer
  addText('Dokument wygenerowany przez BizOps', 50, height - 50, { size: 8, color: rgb(0.5, 0.5, 0.5) })
  
  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}