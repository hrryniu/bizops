import Tesseract, { createWorker, PSM } from 'tesseract.js';
import { OCRResult } from '../types.js';
import { config } from '../env.js';
import { preprocessImage } from './preprocess.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let worker: Tesseract.Worker | null = null;

/**
 * Initialize Tesseract worker
 */
async function getWorker(): Promise<Tesseract.Worker> {
  if (!worker) {
    const cachePath = path.join(process.cwd(), config.cacheDir, 'tessdata');
    
    worker = await createWorker(config.ocrLang, 1, {
      cachePath,
    });
    
    // Configure for better accuracy
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      tessedit_char_whitelist: '',
      preserve_interword_spaces: '1',
    });
  }
  
  return worker;
}

/**
 * Perform OCR using Tesseract
 */
export async function performOCR(
  input: Buffer | string,
  options?: {
    preprocess?: boolean;
    lang?: string;
  }
): Promise<OCRResult> {
  const startTime = Date.now();
  
  // Preprocess image if needed
  let processedInput = input;
  if (options?.preprocess !== false && Buffer.isBuffer(input)) {
    processedInput = await preprocessImage(input);
  }
  
  const tesseractWorker = await getWorker();
  
  // Perform OCR
  const result = await tesseractWorker.recognize(processedInput);
  
  const timeMs = Date.now() - startTime;
  
  return {
    text: result.data.text,
    confidence: result.data.confidence / 100, // Convert to 0-1
    timeMs,
    provider: 'tesseract',
  };
}

/**
 * Cleanup worker
 */
export async function cleanup(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

// Cleanup on process exit
process.on('exit', () => {
  if (worker) {
    worker.terminate();
  }
});

