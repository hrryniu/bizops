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
      companyLogo: string | null
      showLogoOnInvoices: boolean
    } | null
  }
}

export async function generateInvoicePDF(invoice: InvoiceWithDetails, template: string = 'classic') {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
  const fs = await import('fs')
  const path = await import('path')
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  
  const { width, height } = page.getSize()
  
  // Load font that supports UTF-8
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  // Get settings
  const settings = invoice.user.settings
  
  // Load logo if enabled
  let logoImage: any = null
  let logoWidth = 0
  let logoHeight = 0
  
  console.log('[PDF Generator] Logo settings:', {
    showLogoOnInvoices: settings?.showLogoOnInvoices,
    hasCompanyLogo: !!settings?.companyLogo,
    logoPreview: settings?.companyLogo?.substring(0, 50)
  })
  
  if (settings?.showLogoOnInvoices && settings?.companyLogo) {
    try {
      let logoBytes: Buffer
      
      // Check if logo is base64 encoded (starts with 'data:image')
      if (settings.companyLogo.startsWith('data:image')) {
        console.log('[PDF Generator] Loading logo from base64')
        // Extract base64 data from data URL
        const base64Data = settings.companyLogo.split(',')[1]
        logoBytes = Buffer.from(base64Data, 'base64')
        
        // Determine image type from data URL
        const imageType = settings.companyLogo.split(';')[0].split('/')[1]
        console.log('[PDF Generator] Logo image type:', imageType)
        
        if (imageType === 'png') {
          logoImage = await pdfDoc.embedPng(logoBytes)
          console.log('[PDF Generator] PNG logo embedded successfully')
        } else if (imageType === 'jpeg' || imageType === 'jpg') {
          logoImage = await pdfDoc.embedJpg(logoBytes)
          console.log('[PDF Generator] JPG logo embedded successfully')
        } else {
          // For unsupported formats (like TIFF), skip and log warning
          console.warn(`[PDF Generator] Unsupported image format: ${imageType}. Please re-upload logo as PNG or JPG.`)
          console.log('[PDF Generator] To fix: Go to Settings > Company Data and re-upload your logo.')
        }
      } else {
        // Try to load logo from file system (legacy support)
        console.log('[PDF Generator] Loading logo from file system:', settings.companyLogo)
        const logoPath = path.join(process.cwd(), 'public', settings.companyLogo)
        
        if (fs.existsSync(logoPath)) {
          logoBytes = fs.readFileSync(logoPath)
          
          // Determine file type and embed
          if (settings.companyLogo.toLowerCase().endsWith('.png')) {
            logoImage = await pdfDoc.embedPng(logoBytes)
          } else if (settings.companyLogo.toLowerCase().endsWith('.jpg') || 
                     settings.companyLogo.toLowerCase().endsWith('.jpeg')) {
            logoImage = await pdfDoc.embedJpg(logoBytes)
          }
        }
      }
      
      if (logoImage) {
        // Calculate dimensions (max height 40px, maintain aspect ratio)
        const maxHeight = 40
        const aspectRatio = logoImage.width / logoImage.height
        logoHeight = maxHeight
        logoWidth = maxHeight * aspectRatio
        console.log('[PDF Generator] Logo dimensions:', { logoWidth, logoHeight })
      } else {
        console.log('[PDF Generator] Logo image not embedded')
      }
    } catch (error) {
      console.error('[PDF Generator] Error loading logo:', error)
      // Continue without logo if there's an error
    }
  } else {
    console.log('[PDF Generator] Logo disabled or not configured')
  }
  
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
  const addRect = (x: number, y: number, width: number, rectHeight: number, options: any = {}) => {
    page.drawRectangle({
      x,
      y: height - y - rectHeight,
      width,
      height: rectHeight,
      borderColor: options.borderColor || rgb(0.8, 0.8, 0.8),
      borderWidth: options.borderWidth || 0,
      color: options.color,
    })
  }
  
  // Helper function to add logo
  const addLogo = (x: number, y: number) => {
    if (logoImage) {
      page.drawImage(logoImage, {
        x,
        y: height - y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      })
      return logoWidth
    }
    return 0
  }
  
  // Generate based on template
  switch (template) {
    case 'classic':
      generateClassicTemplate(page, invoice, settings, { addText, addLine, addRect, addLogo, width, height, rgb, font, logoWidth, logoHeight })
      break
    case 'professional':
      generateProfessionalTemplate(page, invoice, settings, { addText, addLine, addRect, addLogo, width, height, rgb, font, logoWidth, logoHeight })
      break
    case 'modern':
      generateModernTemplate(page, invoice, settings, { addText, addLine, addRect, addLogo, width, height, rgb, font, logoWidth, logoHeight })
      break
    case 'minimal':
      generateMinimalTemplate(page, invoice, settings, { addText, addLine, addRect, addLogo, width, height, rgb, font, logoWidth, logoHeight })
      break
    default:
      generateClassicTemplate(page, invoice, settings, { addText, addLine, addRect, addLogo, width, height, rgb, font, logoWidth, logoHeight })
  }
  
  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// Classic template inspired by afaktury.pl
function generateClassicTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addLine, addRect, addLogo, width, height, rgb, logoWidth } = helpers
  
  // Logo area
  const logoRenderedWidth = addLogo(50, 50)
  
  // If no logo, show placeholder text
  if (!logoRenderedWidth && settings?.companyName) {
    addText(settings.companyName, 50, 50, { size: 12, color: rgb(0, 0.4, 0.8) })
  }
  
  // Dates in top right
  addText(`Data wystawienia: ${formatDate(invoice.issueDate)}`, width - 180, 50, { size: 10 })
  if (invoice.saleDate) {
    addText(`Data sprzedazy: ${formatDate(invoice.saleDate)}`, width - 180, 65, { size: 10 })
  }
  
  // Invoice number with underline
  addText(`Faktura nr: ${invoice.number}`, 50, 100, { size: 18, color: rgb(0, 0, 0) })
  addLine(50, 112, 250, 112, 2, rgb(0, 0, 0))
  
  // Seller and buyer sections
  addText('Sprzedawca', 50, 135, { size: 11, color: rgb(0, 0, 0) })
  addLine(50, 141, 150, 141, 1, rgb(0, 0, 0))
  
  if (settings) {
    addText(settings.companyName || 'Nazwa firmy', 50, 155, { size: 10 })
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, 168, { size: 10 })
    }
    if (settings.companyNIP) {
      addText(`NIP: ${settings.companyNIP}`, 50, 181, { size: 10 })
    }
    if (settings.companyBankAccount) {
      addText(`Nr konta: ${settings.companyBankAccount}`, 50, 194, { size: 9 })
    }
  }
  
  // Vertical line separator
  addLine(300, 130, 300, 210, 1, rgb(0, 0, 0))
  
  // Buyer section
  addText('Nabywca', 310, 135, { size: 11, color: rgb(0, 0, 0) })
  addLine(310, 141, 450, 141, 1, rgb(0, 0, 0))
  
  if (invoice.buyerPrivatePerson) {
    addText(invoice.buyerPrivatePerson, 310, 155, { size: 10 })
    addText('Osoba prywatna', 310, 168, { size: 10 })
  } else if (invoice.buyer) {
    addText(invoice.buyer.name, 310, 155, { size: 10 })
    if (invoice.buyer.nip) {
      addText(`NIP: ${invoice.buyer.nip}`, 310, 168, { size: 10 })
    }
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 310, 181, { size: 10 })
    }
  }
  
  // Items table
  const tableY = 230
  addRect(50, tableY, width - 100, 25, { color: rgb(0.95, 0.95, 0.95) })
  
  addText('Lp.', 60, tableY + 15, { size: 10 })
  addText('Nazwa towaru/uslugi', 90, tableY + 15, { size: 10 })
  addText('Ilosc', 280, tableY + 15, { size: 10 })
  addText('Cena netto', 330, tableY + 15, { size: 10 })
  addText('VAT', 400, tableY + 15, { size: 10 })
  addText('Brutto', 450, tableY + 15, { size: 10 })
  
  addLine(50, tableY + 25, width - 50, tableY + 25, 1, rgb(0.8, 0.8, 0.8))
  
  // Table rows
  let currentY = tableY + 43
  invoice.items.forEach((item: any, index: number) => {
    addText((index + 1).toString(), 60, currentY, { size: 10 })
    addText(item.name, 90, currentY, { size: 10 })
    addText(`${item.quantity} ${item.unit || ''}`, 280, currentY, { size: 10 })
    addText(parseFloat(item.netPrice).toFixed(2), 330, currentY, { size: 10 })
    addText(`${item.vatRate}%`, 400, currentY, { size: 10 })
    addText(parseFloat(item.lineGross).toFixed(2), 450, currentY, { size: 10 })
    currentY += 18
  })
  
  addLine(50, currentY - 5, width - 50, currentY - 5, 1, rgb(0.6, 0.6, 0.6))
  
  // VAT summary table
  const vatTableY = currentY + 15
  addRect(50, vatTableY, 200, 60, { borderWidth: 1, borderColor: rgb(0.6, 0.6, 0.6) })
  
  addText('Stawka VAT', 60, vatTableY + 12, { size: 10 })
  addText('Netto', 60, vatTableY + 28, { size: 10 })
  addText('VAT', 60, vatTableY + 44, { size: 10 })
  addText('Brutto', 60, vatTableY + 60, { size: 10 })
  
  addText('23%', 140, vatTableY + 12, { size: 10 })
  addText(parseFloat(invoice.totalNet).toFixed(2), 140, vatTableY + 28, { size: 10 })
  addText(parseFloat(invoice.totalVat).toFixed(2), 140, vatTableY + 44, { size: 10 })
  addText(parseFloat(invoice.totalGross).toFixed(2), 140, vatTableY + 60, { size: 10 })
  
  // Payment info
  if (invoice.paymentMethod) {
    addText(`Sposob zaplaty: ${invoice.paymentMethod}`, 50, vatTableY + 90, { size: 10 })
  }
  if (invoice.dueDate) {
    addText(`Termin zaplaty: ${formatDate(invoice.dueDate)}`, 50, vatTableY + 108, { size: 10 })
  }
  
  // Total amount - bigger and more prominent
  addText(`RAZEM DO ZAPLATY:`, 50, vatTableY + 140, { size: 12, color: rgb(0, 0, 0) })
  addText(`${parseFloat(invoice.totalGross).toFixed(2)} ${invoice.currency}`, 50, vatTableY + 160, { size: 16, color: rgb(0, 0, 0) })
  addLine(50, vatTableY + 170, 280, vatTableY + 170, 2, rgb(0, 0, 0))
}

// Professional template inspired by CargoLink
function generateProfessionalTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addLine, addRect, addLogo, width, height, rgb, logoWidth } = helpers
  
  // Logo area
  const logoRenderedWidth = addLogo(50, 30)
  
  // If no logo, show placeholder with company name
  if (!logoRenderedWidth && settings?.companyName) {
    addRect(50, 30, 15, 15, { color: rgb(0, 0.4, 0.8) })
    addText(settings.companyName.charAt(0), 57, 40, { size: 10, color: rgb(1, 1, 1) })
    addText(settings.companyName, 70, 40, { size: 12, color: rgb(0, 0.4, 0.8) })
  }
  
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
  const { addText, addLine, addRect, addLogo, width, height, rgb, logoWidth } = helpers
  
  // Logo at the top
  const logoRenderedWidth = addLogo(50, 40)
  
  // Modern header
  const headerX = logoRenderedWidth > 0 ? 50 + logoRenderedWidth + 20 : 50
  addText('FAKTURA', headerX, 50, { size: 22, color: rgb(0, 0, 0) })
  addText(`NR ${invoice.number}`, headerX, 75, { size: 12, color: rgb(0.4, 0.4, 0.4) })
  addText(formatDate(invoice.issueDate), width - 150, 50, { size: 11, color: rgb(0.4, 0.4, 0.4) })
  
  // Company info
  addText('WYSTAWCA', 50, 110, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  if (settings) {
    addText(settings.companyName || 'Nazwa firmy', 50, 128, { size: 11, color: rgb(0.1, 0.1, 0.1) })
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, 145, { size: 10, color: rgb(0.3, 0.3, 0.3) })
    }
    if (settings.companyNIP) {
      addText(`NIP: ${settings.companyNIP}`, 50, 162, { size: 10, color: rgb(0.3, 0.3, 0.3) })
    }
  }
  
  // Buyer info
  addText('ODBIORCA', 310, 110, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  if (invoice.buyerPrivatePerson) {
    addText(invoice.buyerPrivatePerson, 310, 128, { size: 11, color: rgb(0.1, 0.1, 0.1) })
    addText('Osoba prywatna', 310, 145, { size: 10, color: rgb(0.3, 0.3, 0.3) })
  } else if (invoice.buyer) {
    addText(invoice.buyer.name, 310, 128, { size: 11, color: rgb(0.1, 0.1, 0.1) })
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 310, 145, { size: 10, color: rgb(0.3, 0.3, 0.3) })
    }
  }
  
  addLine(50, 185, width - 50, 185, 1, rgb(0.85, 0.85, 0.85))
  
  // Items table
  const tableY = 205
  addText('POZYCJA', 60, tableY, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  addText('NETTO', width - 200, tableY, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  addText('VAT', width - 120, tableY, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  addText('BRUTTO', width - 80, tableY, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  
  // Table rows
  let currentY = tableY + 22
  invoice.items.forEach((item: any, index: number) => {
    const bgColor = index % 2 === 0 ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1)
    addRect(50, currentY - 8, width - 100, 20, { color: bgColor })
    
    addText(item.name, 60, currentY, { size: 10, color: rgb(0.1, 0.1, 0.1) })
    addText(parseFloat(item.lineNet).toFixed(2), width - 200, currentY, { size: 10, color: rgb(0.2, 0.2, 0.2) })
    addText(parseFloat(item.lineVat).toFixed(2), width - 120, currentY, { size: 10, color: rgb(0.2, 0.2, 0.2) })
    addText(parseFloat(item.lineGross).toFixed(2), width - 80, currentY, { size: 10, color: rgb(0.1, 0.1, 0.1) })
    currentY += 20
  })
  
  addLine(50, currentY - 8, width - 50, currentY - 8, 1, rgb(0.85, 0.85, 0.85))
  
  // Total
  addText('SUMA KONCOWA:', width/2 - 30, currentY + 25, { size: 12, color: rgb(0.1, 0.1, 0.1) })
  addText(`${parseFloat(invoice.totalGross).toFixed(2)} ${invoice.currency}`, width - 80, currentY + 25, { size: 16, color: rgb(0, 0, 0) })
  
  // Payment info
  if (invoice.dueDate) {
    addText(`Zaplac do: ${formatDate(invoice.dueDate)}`, 50, currentY + 55, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  }
  if (invoice.paymentMethod) {
    addText(`Forma platnosci: ${invoice.paymentMethod}`, 50, currentY + 73, { size: 10, color: rgb(0.5, 0.5, 0.5) })
  }
}

// Minimal template (existing)
function generateMinimalTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addLine, addRect, addLogo, width, height, rgb, logoWidth } = helpers
  
  // Logo at the top if available
  const logoRenderedWidth = addLogo(50, 30)
  const startY = logoRenderedWidth > 0 ? 80 : 50
  
  // Minimal header
  addText(`Faktura ${invoice.number}`, 50, startY, { size: 12, color: rgb(0.2, 0.2, 0.2) })
  addText(`Data wystawienia: ${formatDate(invoice.issueDate)}`, 50, startY + 20, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  if (invoice.dueDate) {
    addText(`Termin: ${formatDate(invoice.dueDate)}`, width - 100, startY + 20, { size: 8, color: rgb(0.4, 0.4, 0.4) })
  }
  
  // Company info
  const companyY = startY + 50
  addText('Od:', 50, companyY, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  if (settings) {
    addText(settings.companyName || 'Nazwa firmy', 50, companyY + 15, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    if (settings.companyAddress) {
      addText(settings.companyAddress, 50, companyY + 30, { size: 8, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  // Buyer info
  addText('Dla:', 300, companyY, { size: 8, color: rgb(0.2, 0.2, 0.2) })
  if (invoice.buyerPrivatePerson) {
    addText(invoice.buyerPrivatePerson, 300, companyY + 15, { size: 9, color: rgb(0.4, 0.4, 0.4) })
  } else if (invoice.buyer) {
    addText(invoice.buyer.name, 300, companyY + 15, { size: 9, color: rgb(0.4, 0.4, 0.4) })
    if (invoice.buyer.address) {
      addText(invoice.buyer.address, 300, companyY + 30, { size: 8, color: rgb(0.4, 0.4, 0.4) })
    }
  }
  
  // Items table
  const tableY = companyY + 60
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