/**
 * Integration with invoice-reader module for background invoice processing
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Dynamic import to avoid Next.js ESM issues
async function importInvoiceReader() {
  const module = await import('../../invoice-reader/dist/index.js');
  return module;
}

interface InvoiceData {
  sourceFile: string;
  provider: string;
  confidence: number;
  meta: {
    pages: number;
    ocrMs?: number;
    parsedMs?: number;
  };
  seller: {
    name?: string;
    nip?: string;
    address?: string;
  };
  buyer?: {
    name?: string;
    nip?: string;
    address?: string;
  };
  invoiceNumber?: string;
  issueDate?: string;
  saleDate?: string;
  positions?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    unitPrice?: { value: number; currency: string };
    vatRate?: string;
    net?: { value: number; currency: string };
    vat?: { value: number; currency: string };
    gross?: { value: number; currency: string };
  }>;
  totals?: {
    net?: { value: number; currency: string };
    vat?: { value: number; currency: string };
    gross?: { value: number; currency: string };
  };
  currency?: string;
  rawText: string;
  fields: Array<{ label: string; value: string; bbox?: [number,number,number,number]; page?: number; confidence?: number }>;
  validations: Array<{ name: string; ok: boolean; details?: string }>;
}

interface ProcessingJob {
  id: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: InvoiceData;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// In-memory job queue (in production, use Redis or database)
const jobs = new Map<string, ProcessingJob>();
const processingQueue: string[] = [];
let isProcessing = false;

/**
 * Add invoice to processing queue
 */
export async function queueInvoiceProcessing(filePath: string): Promise<string> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: ProcessingJob = {
    id: jobId,
    filePath,
    status: 'pending',
  };
  
  jobs.set(jobId, job);
  processingQueue.push(jobId);
  
  // Start processing if not already running
  if (!isProcessing) {
    processQueue().catch(console.error);
  }
  
  return jobId;
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): ProcessingJob | undefined {
  return jobs.get(jobId);
}

/**
 * Get all jobs
 */
export function getAllJobs(): ProcessingJob[] {
  return Array.from(jobs.values());
}

/**
 * Process queue in background
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return;
  
  isProcessing = true;
  
  while (processingQueue.length > 0) {
    const jobId = processingQueue.shift();
    if (!jobId) continue;
    
    const job = jobs.get(jobId);
    if (!job) continue;
    
    job.status = 'processing';
    job.startedAt = new Date();
    
    try {
      console.log(`[Invoice Reader] Processing job ${jobId}: ${job.filePath}`);
      
      // Check if file exists
      await fs.access(job.filePath);
      
      // Process invoice
      const invoiceReader = await importInvoiceReader();
      const result = await invoiceReader.readInvoice(job.filePath);
      
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      
      console.log(`[Invoice Reader] ✓ Completed job ${jobId} in ${job.completedAt.getTime() - job.startedAt!.getTime()}ms`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      
      console.error(`[Invoice Reader] ✗ Failed job ${jobId}:`, job.error);
    }
  }
  
  isProcessing = false;
}

/**
 * Process invoice immediately (not queued)
 */
export async function processInvoiceNow(filePath: string): Promise<InvoiceData> {
  console.log(`[Invoice Reader] Processing ${filePath} immediately...`);
  const invoiceReader = await importInvoiceReader();
  return await invoiceReader.readInvoice(filePath);
}

/**
 * Wait for job completion
 */
export async function waitForJob(jobId: string, timeoutMs: number = 60000): Promise<InvoiceData> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const job = jobs.get(jobId);
      
      if (!job) {
        clearInterval(checkInterval);
        reject(new Error('Job not found'));
        return;
      }
      
      if (job.status === 'completed' && job.result) {
        clearInterval(checkInterval);
        resolve(job.result);
        return;
      }
      
      if (job.status === 'failed') {
        clearInterval(checkInterval);
        reject(new Error(job.error || 'Processing failed'));
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        reject(new Error('Job timeout'));
        return;
      }
    }, 500);
  });
}

/**
 * Clear completed jobs older than specified time
 */
export function clearOldJobs(olderThanMs: number = 3600000): number {
  const now = Date.now();
  let cleared = 0;
  
  for (const [jobId, job] of jobs.entries()) {
    if (
      (job.status === 'completed' || job.status === 'failed') &&
      job.completedAt &&
      now - job.completedAt.getTime() > olderThanMs
    ) {
      jobs.delete(jobId);
      cleared++;
    }
  }
  
  return cleared;
}

// Auto-cleanup every hour
setInterval(() => {
  const cleared = clearOldJobs();
  if (cleared > 0) {
    console.log(`[Invoice Reader] Cleared ${cleared} old jobs`);
  }
}, 3600000);

