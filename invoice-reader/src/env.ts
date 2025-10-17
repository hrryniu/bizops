import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from invoice-reader root
dotenv.config({ path: join(__dirname, '../.env') });

export const config = {
  ocrProvider: (process.env.OCR_PROVIDER || 'local') as 'local' | 'gcv' | 'textract',
  ocrLang: process.env.OCR_LANG || 'pol+eng',
  concurrency: parseInt(process.env.CONCURRENCY || '4', 10),
  cacheDir: process.env.CACHE_DIR || '.cache',
  
  // Google Cloud Vision
  gcvProjectId: process.env.GCV_PROJECT_ID,
  gcvKeyfile: process.env.GCV_KEYFILE,
  
  // AWS Textract
  awsRegion: process.env.AWS_REGION || 'eu-central-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  
  // PDF settings
  pdfDpi: parseInt(process.env.PDF_DPI || '300', 10),
  pdfScale: parseFloat(process.env.PDF_SCALE || '1.5'),
  
  // Image preprocessing
  imageEnhance: process.env.IMAGE_ENHANCE !== 'false',
  imageThreshold: process.env.IMAGE_THRESHOLD !== 'false',
  
  // Debug
  debug: process.env.DEBUG === 'true',
};

export function validateConfig(): void {
  if (config.ocrProvider === 'gcv') {
    if (!config.gcvProjectId || !config.gcvKeyfile) {
      throw new Error('GCV_PROJECT_ID and GCV_KEYFILE must be set for Google Cloud Vision');
    }
  }
  
  if (config.ocrProvider === 'textract') {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      throw new Error('AWS credentials must be set for Textract');
    }
  }
}


