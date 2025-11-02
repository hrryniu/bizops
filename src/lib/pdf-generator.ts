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

export async function generateInvoicePDF(invoice: InvoiceWithDetails) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
  const fontkit = await import('@pdf-lib/fontkit')
  const fs = await import('fs')
  const path = await import('path')
  const https = await import('https')
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  
  // Register fontkit to support custom fonts
  pdfDoc.registerFontkit(fontkit.default)
  
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  
  const { width, height } = page.getSize()
  
  // Load font that supports Polish characters (UTF-8)
  let font
  try {
    // Try to load Roboto font from CDN (supports Polish characters)
    const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf'
    
    const fontBytes = await new Promise<Buffer>((resolve, reject) => {
      https.get(fontUrl, (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
        response.on('error', reject)
      }).on('error', reject)
    })
    
    font = await pdfDoc.embedFont(fontBytes)
    console.log('[PDF Generator] Loaded Roboto font with Polish characters support')
  } catch (error) {
    console.warn('[PDF Generator] Failed to load Roboto font, falling back to Helvetica:', error)
    // Fallback to Helvetica if font loading fails
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  }
  
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
        // Calculate dimensions (max height 120px, maintain aspect ratio)
        const maxHeight = 120
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
    // Clean up text (remove extra whitespace and newlines, but keep Polish characters)
    const cleanText = text
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .replace(/\r/g, ' ')  // Replace carriage returns with spaces
      .replace(/\t/g, ' ')  // Replace tabs with spaces
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim()
    
    page.drawText(cleanText, {
      x,
      y: height - y,
      size: options.size || 10,
      color: options.color || rgb(0.2, 0.2, 0.2),
      font,
      ...options,
    })
  }
  
  // Helper function to wrap text to multiple lines
  const wrapText = (text: string, maxWidth: number, fontSize: number = 10): string[] => {
    // Clean up text but keep Polish characters
    const cleanText = text
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .replace(/\r/g, ' ')  // Replace carriage returns with spaces
      .replace(/\t/g, ' ')  // Replace tabs with spaces
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim()
    
    const words = cleanText.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = font.widthOfTextAtSize(testLine, fontSize)
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }
  
  // Helper function to add wrapped text
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, options: any = {}) => {
    const fontSize = options.size || 10
    const lineHeight = fontSize * 1.3
    const lines = wrapText(text, maxWidth, fontSize)
    
    lines.forEach((line, index) => {
      addText(line, x, y + (index * lineHeight), options)
    })
    
    return lines.length * lineHeight // Return total height used
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
  
  // Generate invoice template
  generateInvoiceTemplate(page, invoice, settings, { addText, addWrappedText, addLine, addRect, addLogo, width, height, rgb, font, logoWidth, logoHeight })
  
  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// Professional invoice template based on JIMBO MEDIA design
function generateInvoiceTemplate(page: any, invoice: any, settings: any, helpers: any) {
  const { addText, addWrappedText, addLine, addRect, addLogo, width, height, rgb, logoWidth, logoHeight } = helpers
  
  // === SECTION 1: LOGO (Top-Left) ===
  const logoRenderedWidth = addLogo(40, 40)
  
  // === SECTION 2: SELLER INFO ("Sprzedawca") - Left Side ===
  let sellerY = logoHeight + 50
  addText('Sprzedawca', 50, sellerY, { size: 11, color: rgb(0, 0, 0) })
  addLine(50, sellerY + 6, 150, sellerY + 6, 1, rgb(0, 0, 0))
  sellerY += 18
  
  if (settings) {
    const companyNameHeight = addWrappedText(settings.companyName || 'Nazwa firmy', 50, sellerY, 220, { size: 10, color: rgb(0, 0, 0) })
    sellerY += companyNameHeight + 5
    if (settings.companyAddress) {
      const addressHeight = addWrappedText(settings.companyAddress, 50, sellerY, 220, { size: 9 })
      sellerY += addressHeight + 5
    }
    if (settings.companyNIP) {
      addText(`NIP: ${settings.companyNIP}`, 50, sellerY, { size: 9 })
      sellerY += 14
    }
    // Email/website można dodać jeśli dostępne
  }
  
  // === SECTION 3: INVOICE TITLE & NUMBER (Centered, One Line) ===
  let titleY = 50
  const invoiceTitle = `Faktura nr: ${invoice.number}`
  const titleWidth = helpers.font.widthOfTextAtSize(invoiceTitle, 16)
  const centeredX = (width - titleWidth) / 2
  addText(invoiceTitle, centeredX, titleY, { size: 16, color: rgb(0, 0, 0) })
  
  // === SECTION 4: DATES (Right Side, Below Title) ===
  const invoiceTitleX = width - 180
  let dateY = titleY + 30
  addText(`Wystawiona w dniu:`, invoiceTitleX - 30, dateY, { size: 9, color: rgb(0.3, 0.3, 0.3) })
  dateY += 14
  addText(formatDate(invoice.issueDate), invoiceTitleX - 30, dateY, { size: 9 })
  
  if (invoice.saleDate) {
    dateY += 18
    addText(`Data zakończenia dostawy/usługi:`, invoiceTitleX - 30, dateY, { size: 8, color: rgb(0.3, 0.3, 0.3) })
    dateY += 14
    addText(formatDate(invoice.saleDate), invoiceTitleX - 30, dateY, { size: 9 })
  }
  
  // === SECTION 5: BUYER INFO ("Nabywca") - Right Side ===
  let buyerY = dateY + 25
  addText('Nabywca', invoiceTitleX - 30, buyerY, { size: 11, color: rgb(0, 0, 0) })
  addLine(invoiceTitleX - 30, buyerY + 6, invoiceTitleX + 90, buyerY + 6, 1, rgb(0, 0, 0))
  buyerY += 18
  
  if (invoice.buyerPrivatePerson) {
    const personHeight = addWrappedText(invoice.buyerPrivatePerson, invoiceTitleX - 30, buyerY, 200, { size: 10, color: rgb(0, 0, 0) })
    buyerY += personHeight + 5
    addText('Osoba prywatna', invoiceTitleX - 30, buyerY, { size: 9, color: rgb(0.4, 0.4, 0.4) })
  } else if (invoice.buyer) {
    const nameHeight = addWrappedText(invoice.buyer.name, invoiceTitleX - 30, buyerY, 200, { size: 10, color: rgb(0, 0, 0) })
    buyerY += nameHeight + 5
    if (invoice.buyer.address) {
      const addressHeight = addWrappedText(invoice.buyer.address, invoiceTitleX - 30, buyerY, 200, { size: 9 })
      buyerY += addressHeight + 5
    }
    if (invoice.buyer.nip) {
      addText(`NIP: ${invoice.buyer.nip}`, invoiceTitleX - 30, buyerY, { size: 9 })
      buyerY += 14
    }
  }
  
  // === SECTION 7: ITEMS TABLE ===
  const tableStartY = Math.max(buyerY, sellerY) + 40
  
  // Table header with 9 columns - adjusted to prevent overlap
  const col1X = 50   // Lp.
  const col2X = 75   // Nazwa
  const col3X = 245  // J.m.
  const col4X = 280  // Ilość
  const col5X = 315  // Cena netto
  const col6X = 370  // Wartość netto
  const col7X = 430  // VAT %
  const col8X = 470  // Kwota VAT
  const col9X = 520  // Wartość brutto
  
  // Header background
  addRect(col1X, tableStartY, width - 100, 18, { color: rgb(0.9, 0.9, 0.9) })
  addLine(col1X, tableStartY, width - 50, tableStartY, 1, rgb(0, 0, 0))
  addLine(col1X, tableStartY + 18, width - 50, tableStartY + 18, 1, rgb(0, 0, 0))
  
  // Header text
  let headerY = tableStartY + 12
  addText('Lp.', col1X + 5, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('Nazwa towaru lub usługi', col2X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('J.m.', col3X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('Ilość', col4X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('Cena netto', col5X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('Wartość netto', col6X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('VAT %', col7X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('Kwota VAT', col8X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  addText('Brutto', col9X, headerY, { size: 7.5, color: rgb(0, 0, 0) })
  
  // Table rows
  let currentRowY = tableStartY + 32
  invoice.items.forEach((item: any, index: number) => {
    // Row data
    addText((index + 1).toString(), col1X + 5, currentRowY, { size: 9 })
    
    // Calculate height needed for wrapped item name
    const itemNameHeight = addWrappedText(item.name, col2X, currentRowY, 160, { size: 9 })
    
    addText(item.unit || 'szt.', col3X, currentRowY, { size: 9 })
    addText(item.quantity.toString(), col4X, currentRowY, { size: 9 })
    addText(parseFloat(item.netPrice).toFixed(2), col5X, currentRowY, { size: 9 })
    addText(parseFloat(item.lineNet).toFixed(2), col6X, currentRowY, { size: 9 })
    addText(`${item.vatRate}%`, col7X, currentRowY, { size: 9 })
    addText(parseFloat(item.lineVat).toFixed(2), col8X, currentRowY, { size: 9 })
    addText(parseFloat(item.lineGross).toFixed(2), col9X, currentRowY, { size: 9 })
    
    // Use the actual height needed for the row (minimum 18px, or more if text wrapped)
    const rowHeight = Math.max(18, itemNameHeight + 6)
    currentRowY += rowHeight
    
    // Draw separator line between rows (not after the last row)
    if (index < invoice.items.length - 1) {
      addLine(col1X, currentRowY + 2, width - 50, currentRowY + 2, 0.5, rgb(0.7, 0.7, 0.7))
    }
  })
  
  // === SECTION 8: TOTALS ===
  const totalsY = currentRowY + 15
  
  // Total row
  addText('Razem', col2X, totalsY, { size: 10, color: rgb(0, 0, 0) })
  addText(parseFloat(invoice.totalNet).toFixed(2), col6X, totalsY, { size: 10, color: rgb(0, 0, 0) })
  addText(parseFloat(invoice.totalVat).toFixed(2), col8X, totalsY, { size: 10, color: rgb(0, 0, 0) })
  addText(parseFloat(invoice.totalGross).toFixed(2), col9X, totalsY, { size: 10, color: rgb(0, 0, 0) })
  
  // === SECTION 9: TOTAL AMOUNT DUE ===
  const amountDueY = totalsY + 30
  addText('Razem do zapłaty:', 50, amountDueY, { size: 12, color: rgb(0, 0, 0) })
  addText(`${parseFloat(invoice.totalGross).toFixed(2)} ${invoice.currency}`, 180, amountDueY, { size: 14, color: rgb(0, 0, 0) })
  
  // Amount in words (słownie)
  const amountInWordsY = amountDueY + 20
  addText('Słownie złotych:', 50, amountInWordsY, { size: 9, color: rgb(0.3, 0.3, 0.3) })
  // Simple conversion - można ulepszyć
  addText(`(${parseFloat(invoice.totalGross).toFixed(2)} PLN)`, 50, amountInWordsY + 14, { size: 9 })
  
  // === PAYMENT METHOD (after amount) ===
  const paymentMethodY = amountInWordsY + 35
  if (invoice.paymentMethod) {
    addText(`Sposób zapłaty: ${invoice.paymentMethod}`, 50, paymentMethodY, { size: 10, color: rgb(0, 0, 0) })
  }
  
  // === BANK ACCOUNT NUMBER ===
  let bankAccountY = paymentMethodY + 18
  let bankAccountNumber = null
  
  // Try to get bank account from selectedBankAccount or from settings
  if (invoice.selectedBankAccount) {
    // Parse bank accounts from settings
    try {
      const bankAccounts = settings?.bankAccounts ? JSON.parse(settings.bankAccounts) : []
      const selectedAccount = bankAccounts.find((acc: any) => acc.name === invoice.selectedBankAccount)
      if (selectedAccount) {
        bankAccountNumber = selectedAccount.accountNumber
      }
    } catch (e) {
      // If parsing fails, try companyBankAccount
      bankAccountNumber = settings?.companyBankAccount
    }
  } else {
    // Fallback to companyBankAccount from settings
    bankAccountNumber = settings?.companyBankAccount
  }
  
  if (bankAccountNumber) {
    addText(`Numer konta: ${bankAccountNumber}`, 50, bankAccountY, { size: 10, color: rgb(0, 0, 0) })
    bankAccountY += 18
  }
  
  // === DUE DATE (TERMIN PŁATNOŚCI) ===
  if (invoice.dueDate) {
    addText(`Termin płatności: ${formatDate(invoice.dueDate)}`, 50, bankAccountY, { size: 10, color: rgb(0, 0, 0) })
    bankAccountY += 18
  }
  
  // === SECTION 10: NOTES ===
  const notesY = bankAccountY + 10
  if (invoice.notes) {
    // Remove duplicate phrases from notes
    const cleanNotes = (() => {
      let text = invoice.notes.trim()
      
      // Try to detect and remove repeating patterns
      // Check if text contains obvious duplicates by looking for repeated sequences
      const words = text.split(/\s+/)
      if (words.length > 10) {
        // For longer texts, try to find if first half repeats in second half
        const halfLength = Math.floor(words.length / 2)
        const firstHalf = words.slice(0, halfLength).join(' ')
        const remaining = words.slice(halfLength).join(' ')
        
        // If first part appears again in the remaining text, it's likely a duplicate
        if (remaining.includes(firstHalf.substring(0, Math.min(50, firstHalf.length)))) {
          return firstHalf + '.'
        }
      }
      
      // Also check for simpler repetitions (same text repeated twice)
      const possibleDuplicateLength = Math.floor(text.length / 2)
      for (let len = possibleDuplicateLength; len >= 20; len--) {
        const firstPart = text.substring(0, len).trim()
        const secondPart = text.substring(len).trim()
        
        // Check if second part starts with first part (allowing for minor variations)
        if (secondPart.startsWith(firstPart.substring(0, Math.min(30, firstPart.length)))) {
          return firstPart
        }
      }
      
      return text
    })()
    
    addText('Uwagi:', 50, notesY, { size: 9, color: rgb(0, 0, 0) })
    addWrappedText(cleanNotes, 50, notesY + 14, width - 100, { size: 8, color: rgb(0.3, 0.3, 0.3) })
  }
  
  // === SECTION 11: SIGNATURE LINES ===
  const signatureY = height - 100
  addLine(50, signatureY, 200, signatureY, 1, rgb(0.5, 0.5, 0.5))
  addLine(width - 250, signatureY, width - 50, signatureY, 1, rgb(0.5, 0.5, 0.5))
  
  addText('podpis osoby upoważnionej', 50, signatureY + 10, { size: 7, color: rgb(0.4, 0.4, 0.4) })
  addText('do odbioru faktury', 50, signatureY + 18, { size: 7, color: rgb(0.4, 0.4, 0.4) })
  
  addText('podpis osoby upoważnionej', width - 250, signatureY + 10, { size: 7, color: rgb(0.4, 0.4, 0.4) })
  addText('do wystawienia faktury', width - 250, signatureY + 18, { size: 7, color: rgb(0.4, 0.4, 0.4) })
}
