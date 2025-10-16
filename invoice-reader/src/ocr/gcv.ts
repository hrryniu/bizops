import vision, { ImageAnnotatorClient } from '@google-cloud/vision';
import { OCRResult } from '../types.js';
import { config } from '../env.js';
import * as fs from 'fs/promises';

let client: ImageAnnotatorClient | null = null;

/**
 * Get GCV client
 */
function getClient(): ImageAnnotatorClient {
  if (!client) {
    client = new vision.ImageAnnotatorClient({
      projectId: config.gcvProjectId,
      keyFilename: config.gcvKeyfile,
    });
  }
  return client;
}

/**
 * Perform OCR using Google Cloud Vision
 */
export async function performGCVOCR(filePath: string): Promise<OCRResult> {
  const startTime = Date.now();
  
  const visionClient = getClient();
  
  // Read image file
  const imageBuffer = await fs.readFile(filePath);
  
  // Perform document text detection
  const [result] = await visionClient.documentTextDetection({
    image: { content: imageBuffer },
  });
  
  const fullTextAnnotation = result.fullTextAnnotation;
  
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
    throw new Error('No text detected by Google Cloud Vision');
  }
  
  // Calculate average confidence
  const pages = fullTextAnnotation.pages || [];
  let totalConfidence = 0;
  let wordCount = 0;
  
  for (const page of pages) {
    for (const block of page.blocks || []) {
      for (const paragraph of block.paragraphs || []) {
        for (const word of paragraph.words || []) {
          if (word.confidence) {
            totalConfidence += word.confidence;
            wordCount++;
          }
        }
      }
    }
  }
  
  const confidence = wordCount > 0 ? totalConfidence / wordCount : 0.5;
  const timeMs = Date.now() - startTime;
  
  return {
    text: fullTextAnnotation.text,
    confidence,
    timeMs,
    provider: 'gcv',
  };
}

