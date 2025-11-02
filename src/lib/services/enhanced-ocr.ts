/**
 * 📷 Enhanced OCR Service
 * 
 * Hybrid OCR system combining multiple providers:
 * - Google Cloud Vision
 * - OpenAI Vision API
 * - Tesseract.js (fallback)
 * - Automatic field extraction and categorization
 */

import OpenAI from 'openai'
import { vision } from '@google-cloud/vision'
import Tesseract from 'tesseract.js'
import { OCR_CONFIG, AI_CONFIG, APP_CONFIG } from '@/lib/config'
import { prisma } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

// ========================================
// Types
// ========================================

export interface OCRResult {
  success: boolean
  extractedText: string
  confidence: number
  fields?: ExtractedFields
  provider: 'google' | 'openai' | 'tesseract'
  processingTime: number
}

export interface ExtractedFields {
  vendor?: string
  vendorNIP?: string
  vendorAddress?: string
  docNumber?: string
  issueDate?: Date
  amount?: number
  netAmount?: number
  vatAmount?: number
  vatRate?: string
  category?: string
  paymentMethod?: string
}

export interface OCRJobResult {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: OCRResult
  error?: string
}

// ========================================
// Enhanced OCR Service
// ========================================

export class EnhancedOCRService {
  private googleClient: any
  private openaiClient: OpenAI | null = null

  constructor() {
    // Initialize Google Cloud Vision
    if (OCR_CONFIG.googleCloud.credentials && OCR_CONFIG.googleCloud.projectId) {
      try {
        this.googleClient = new vision.ImageAnnotatorClient({
          keyFilename: OCR_CONFIG.googleCloud.credentials,
          projectId: OCR_CONFIG.googleCloud.projectId,
        })
      } catch (error) {
        console.warn('Google Cloud Vision not configured:', error)
      }
    }

    // Initialize OpenAI
    if (AI_CONFIG.openai.apiKey && OCR_CONFIG.openaiVision.enabled) {
      this.openaiClient = new OpenAI({
        apiKey: AI_CONFIG.openai.apiKey,
      })
    }
  }

  /**
   * Process document with hybrid OCR
   */
  async processDocument(filePath: string): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      // Try OpenAI Vision first (best for structured data extraction)
      if (this.openaiClient && OCR_CONFIG.openaiVision.enabled) {
        try {
          const result = await this.processWithOpenAI(filePath)
          if (result.confidence > 0.8) {
            return {
              ...result,
              processingTime: Date.now() - startTime,
            }
          }
        } catch (error) {
          console.warn('OpenAI Vision failed, falling back:', error)
        }
      }

      // Try Google Cloud Vision
      if (this.googleClient) {
        try {
          const result = await this.processWithGoogle(filePath)
          if (result.confidence > 0.7) {
            return {
              ...result,
              processingTime: Date.now() - startTime,
            }
          }
        } catch (error) {
          console.warn('Google Cloud Vision failed, falling back:', error)
        }
      }

      // Fallback to Tesseract
      const result = await this.processWithTesseract(filePath)
      return {
        ...result,
        processingTime: Date.now() - startTime,
      }
    } catch (error: any) {
      console.error('OCR processing failed:', error)
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        provider: 'tesseract',
        processingTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Process with OpenAI Vision
   */
  private async processWithOpenAI(filePath: string): Promise<Omit<OCRResult, 'processingTime'>> {
    if (!this.openaiClient) throw new Error('OpenAI not configured')

    // Read image file
    const imageBuffer = await fs.readFile(filePath)
    const base64Image = imageBuffer.toString('base64')
    const ext = path.extname(filePath).toLowerCase()
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'

    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Przeanalizuj to zdjęcie faktury lub paragonu i wyodrębnij następujące dane w formacie JSON:
{
  "vendor": "nazwa sprzedawcy",
  "vendorNIP": "NIP sprzedawcy",
  "vendorAddress": "adres sprzedawcy",
  "docNumber": "numer dokumentu",
  "issueDate": "data wystawienia (YYYY-MM-DD)",
  "amount": wartość brutto jako liczba,
  "netAmount": wartość netto jako liczba,
  "vatAmount": kwota VAT jako liczba,
  "vatRate": "stawka VAT (np. 23)",
  "category": "kategoria (np. Transport, Biuro, Wyposażenie)",
  "paymentMethod": "metoda płatności"
}

Jeśli nie możesz znaleźć danej wartości, pozostaw pole puste. Zwróć tylko JSON bez dodatkowego tekstu.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content || '{}'
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    // Parse dates
    if (extractedData.issueDate) {
      try {
        extractedData.issueDate = new Date(extractedData.issueDate)
      } catch {
        delete extractedData.issueDate
      }
    }

    return {
      success: true,
      extractedText: content,
      confidence: 0.9, // OpenAI Vision typically very accurate
      fields: extractedData,
      provider: 'openai',
    }
  }

  /**
   * Process with Google Cloud Vision
   */
  private async processWithGoogle(filePath: string): Promise<Omit<OCRResult, 'processingTime'>> {
    if (!this.googleClient) throw new Error('Google Cloud Vision not configured')

    const [result] = await this.googleClient.documentTextDetection(filePath)
    const fullTextAnnotation = result.fullTextAnnotation

    if (!fullTextAnnotation) {
      throw new Error('No text detected')
    }

    const text = fullTextAnnotation.text
    const confidence = fullTextAnnotation.pages?.[0]?.confidence || 0.7

    // Extract fields from text
    const fields = this.extractFieldsFromText(text)

    return {
      success: true,
      extractedText: text,
      confidence,
      fields,
      provider: 'google',
    }
  }

  /**
   * Process with Tesseract
   */
  private async processWithTesseract(filePath: string): Promise<Omit<OCRResult, 'processingTime'>> {
    const { data } = await Tesseract.recognize(filePath, 'pol+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })

    const fields = this.extractFieldsFromText(data.text)

    return {
      success: true,
      extractedText: data.text,
      confidence: data.confidence / 100,
      fields,
      provider: 'tesseract',
    }
  }

  /**
   * Extract structured fields from raw text
   */
  private extractFieldsFromText(text: string): ExtractedFields {
    const fields: ExtractedFields = {}

    // Extract NIP (Polish tax ID)
    const nipMatch = text.match(/NIP[:\s]*(\d{10}|\d{3}-\d{3}-\d{2}-\d{2}|\d{3}-\d{2}-\d{2}-\d{3})/i)
    if (nipMatch) {
      fields.vendorNIP = nipMatch[1].replace(/-/g, '')
    }

    // Extract document number
    const docNumberMatch = text.match(/(FV|FA|VAT|Faktura)[:\s]*([A-Z0-9\/-]+)/i)
    if (docNumberMatch) {
      fields.docNumber = docNumberMatch[2]
    }

    // Extract date (various Polish formats)
    const dateMatch = text.match(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/
)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      fields.issueDate = new Date(`${year}-${month}-${day}`)
    }

    // Extract amounts (look for "Razem", "Do zapłaty", etc.)
    const amountMatch = text.match(/(Razem|Do zapłaty|Suma)[:\s]*(\d+[,.]?\d*)/i)
    if (amountMatch) {
      fields.amount = parseFloat(amountMatch[2].replace(',', '.'))
    }

    // Extract VAT rate
    const vatRateMatch = text.match(/VAT\s*(\d+)%/i)
    if (vatRateMatch) {
      fields.vatRate = vatRateMatch[1]
    }

    // Auto-categorize based on keywords
    fields.category = this.categorizeFromText(text)

    return fields
  }

  /**
   * Categorize expense based on text content
   */
  private categorizeFromText(text: string): string {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('paliw') || lowerText.includes('benzyn') || lowerText.includes('diesel')) {
      return 'Transport'
    }
    if (lowerText.includes('biuro') || lowerText.includes('wynajem') || lowerText.includes('czynsz')) {
      return 'Biuro'
    }
    if (lowerText.includes('komputer') || lowerText.includes('laptop') || lowerText.includes('monitor')) {
      return 'Wyposażenie'
    }
    if (lowerText.includes('reklam') || lowerText.includes('marketing') || lowerText.includes('ogłoszeni')) {
      return 'Marketing'
    }
    if (lowerText.includes('restauracj') || lowerText.includes('hotel') || lowerText.includes('nocleg')) {
      return 'Reprezentacja'
    }
    if (lowerText.includes('telefon') || lowerText.includes('internet') || lowerText.includes('hosting')) {
      return 'Usługi telekomunikacyjne'
    }

    return 'Inne'
  }

  /**
   * Process expense document and save to database
   */
  async processExpenseDocument(
    userId: string,
    filePath: string,
    attachmentPath: string
  ): Promise<string> {
    // Process OCR
    const ocrResult = await this.processDocument(filePath)

    if (!ocrResult.success || !ocrResult.fields) {
      throw new Error('Failed to extract data from document')
    }

    const fields = ocrResult.fields

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        userId,
        contractorName: fields.vendor,
        contractorNIP: fields.vendorNIP,
        contractorAddress: fields.vendorAddress,
        docNumber: fields.docNumber,
        date: fields.issueDate || new Date(),
        issueDate: fields.issueDate,
        category: fields.category,
        vatRate: fields.vatRate,
        netAmount: fields.netAmount || 0,
        vatAmount: fields.vatAmount || 0,
        grossAmount: fields.amount || 0,
        attachmentPath,
        notes: `Auto-imported via OCR (${ocrResult.provider}, confidence: ${Math.round(ocrResult.confidence * 100)}%)`,
      },
    })

    return expense.id
  }

  /**
   * Queue OCR job for async processing
   */
  async queueOCRJob(userId: string, filePath: string, attachmentPath: string): Promise<string> {
    // For simplicity, we'll process synchronously for now
    // In production, you'd use a proper job queue (Bull, Agenda, etc.)
    
    try {
      const expenseId = await this.processExpenseDocument(userId, filePath, attachmentPath)
      return expenseId
    } catch (error: any) {
      console.error('OCR job failed:', error)
      throw error
    }
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Process document with OCR
 */
export async function processDocumentOCR(filePath: string): Promise<OCRResult> {
  const service = new EnhancedOCRService()
  return await service.processDocument(filePath)
}

/**
 * Auto-import expense from document
 */
export async function autoImportExpense(
  userId: string,
  filePath: string,
  attachmentPath: string
): Promise<string> {
  const service = new EnhancedOCRService()
  return await service.processExpenseDocument(userId, filePath, attachmentPath)
}











