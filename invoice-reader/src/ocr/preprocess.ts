import { config } from '../env.js';

export interface PreprocessOptions {
  enhance?: boolean;
  threshold?: boolean;
  scale?: number;
  denoise?: boolean;
}

/**
 * Simplified image preprocessing - returns original buffer
 * In production, you would use sharp or similar library
 */
export async function preprocessImage(
  input: Buffer | string,
  options?: PreprocessOptions
): Promise<Buffer> {
  try {
    // For now, return original buffer to avoid Sharp dependency issues
    // In production, you would implement proper image preprocessing
    console.log('[Preprocess] Skipping image preprocessing (Sharp dependency disabled)');
    
    if (Buffer.isBuffer(input)) {
      return input;
    } else {
      // If input is string (file path), we would need to read it
      // For now, return empty buffer
      return Buffer.alloc(0);
    }
  } catch (error) {
    console.warn('[Preprocess] Failed to preprocess image, using original:', error);
    return Buffer.isBuffer(input) ? input : Buffer.alloc(0);
  }
}

/**
 * Check if file is an image
 */
export function isImage(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith('.jpg') || 
         lower.endsWith('.jpeg') || 
         lower.endsWith('.png');
}

