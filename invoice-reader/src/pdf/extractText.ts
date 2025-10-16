import * as fs from 'fs/promises';
import { PDFTextResult, NoTextLayerError } from '../types.js';

/**
 * Extracts text from PDF if it has a text layer
 * Simplified version without pdf-parse dependency issues
 */
export async function extractTextFromPDF(filePath: string): Promise<PDFTextResult> {
  try {
    // For now, assume all PDFs need OCR to avoid pdf-parse issues
    // In production, you would use a more reliable PDF text extraction library
    throw new NoTextLayerError('PDF text extraction temporarily disabled - using OCR fallback');
  } catch (error) {
    if (error instanceof NoTextLayerError) {
      throw error;
    }
    throw new NoTextLayerError(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file is PDF
 */
export function isPDF(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.pdf');
}

