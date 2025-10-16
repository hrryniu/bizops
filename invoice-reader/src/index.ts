import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { InvoiceData, NoTextLayerError, OCRResult } from './types.js';
import { config, validateConfig } from './env.js';
import { isPDF, extractTextFromPDF } from './pdf/extractText.js';
import { rasterizePDF } from './pdf/rasterize.js';
import { isImage, preprocessImage } from './ocr/preprocess.js';
import { performOCR } from './ocr/localTesseract.js';
import { performGCVOCR } from './ocr/gcv.js';
import { performTextractOCR } from './ocr/textract.js';
import { normalizeInvoiceData } from './parse/normalize.js';

/**
 * Main function to read invoice from file
 */
export async function readInvoice(filePath: string): Promise<InvoiceData> {
  validateConfig();
  
  // Check if file exists
  await fs.access(filePath);
  
  // Try to get from cache
  const cached = await getCachedResult(filePath);
  if (cached) {
    console.log(`Using cached result for ${filePath}`);
    return cached;
  }
  
  let rawText = '';
  let provider: InvoiceData['provider'] = 'tesseract';
  let ocrConfidence = 0.5;
  let ocrMs = 0;
  let pages = 1;
  
  const startTime = Date.now();
  
  try {
    if (isPDF(filePath)) {
      // Try to extract text layer first
      try {
        const pdfResult = await extractTextFromPDF(filePath);
        rawText = pdfResult.text;
        provider = 'builtin-pdf';
        ocrConfidence = 0.95; // High confidence for digital PDF
        pages = pdfResult.pages;
        console.log(`Extracted text from PDF (${pages} pages)`);
      } catch (error) {
        if (error instanceof NoTextLayerError) {
          console.log('PDF has no text layer, will use OCR');
          
          // Rasterize PDF for OCR
          const images = await rasterizePDF(filePath);
          pages = images.length;
          
          // Perform OCR on each page
          const ocrResults: string[] = [];
          for (const [index, image] of images.entries()) {
            console.log(`OCR page ${index + 1}/${pages}...`);
            const result = await performOCROnImage(image);
            ocrResults.push(result.text);
            ocrConfidence = Math.min(ocrConfidence, result.confidence);
            ocrMs += result.timeMs;
            provider = result.provider;
          }
          
          rawText = ocrResults.join('\n\n');
        } else {
          throw error;
        }
      }
    } else if (isImage(filePath)) {
      // Process image file
      const imageBuffer = await fs.readFile(filePath);
      const result = await performOCROnImage(imageBuffer, filePath);
      rawText = result.text;
      ocrConfidence = result.confidence;
      ocrMs = result.timeMs;
      provider = result.provider;
    } else {
      throw new Error(`Unsupported file format: ${filePath}`);
    }
    
    // Normalize and structure the data
    const invoiceData = normalizeInvoiceData(rawText, filePath, provider, ocrConfidence, {
      pages,
      ocrMs,
    });
    
    // Cache the result
    await cacheResult(filePath, invoiceData);
    
    return invoiceData;
  } catch (error) {
    throw new Error(`Failed to process invoice ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Perform OCR on image using configured provider
 */
async function performOCROnImage(
  input: Buffer,
  filePath?: string
): Promise<OCRResult> {
  const provider = config.ocrProvider;
  
  switch (provider) {
    case 'gcv':
      if (!filePath) {
        throw new Error('GCV requires file path');
      }
      return await performGCVOCR(filePath);
    
    case 'textract':
      if (!filePath) {
        throw new Error('Textract requires file path');
      }
      return await performTextractOCR(filePath);
    
    case 'local':
    default:
      return await performOCR(input, { preprocess: true });
  }
}

/**
 * Get cached OCR result
 */
async function getCachedResult(filePath: string): Promise<InvoiceData | null> {
  try {
    const hash = await getFileHash(filePath);
    const cachePath = path.join(config.cacheDir, 'ocr', `${hash}.json`);
    
    const cached = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(cached) as InvoiceData;
  } catch {
    return null;
  }
}

/**
 * Cache OCR result
 */
async function cacheResult(filePath: string, data: InvoiceData): Promise<void> {
  try {
    const hash = await getFileHash(filePath);
    const cacheDir = path.join(config.cacheDir, 'ocr');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cachePath = path.join(cacheDir, `${hash}.json`);
    await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
  } catch (error) {
    // Ignore cache errors
    console.warn('Failed to cache result:', error);
  }
}

/**
 * Calculate file hash for caching
 */
async function getFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Export all modules
export * from './types.js';
export * from './queue.js';
export { config } from './env.js';

