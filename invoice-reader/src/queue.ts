import { config } from './env.js';
import { readInvoice } from './index.js';
import { InvoiceData } from './types.js';

// Simple concurrency limiter without p-limit dependency
class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private limit: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        this.running++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running < this.limit && this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) fn();
    }
  }
}

/**
 * Process multiple invoices with concurrency limit
 */
export async function readManyInvoices(
  filePaths: string[],
  options?: {
    concurrency?: number;
    onProgress?: (completed: number, total: number, file: string) => void;
    onError?: (file: string, error: Error) => void;
  }
): Promise<InvoiceData[]> {
  const concurrency = options?.concurrency || config.concurrency;
  const limiter = new ConcurrencyLimiter(concurrency);
  
  const results: InvoiceData[] = [];
  let completed = 0;
  
  const tasks = filePaths.map((filePath) =>
    limiter.run(async () => {
      try {
        const data = await readInvoice(filePath);
        results.push(data);
        completed++;
        
        if (options?.onProgress) {
          options.onProgress(completed, filePaths.length, filePath);
        }
        
        return data;
      } catch (error) {
        completed++;
        
        if (options?.onError) {
          options.onError(filePath, error as Error);
        }
        
        if (options?.onProgress) {
          options.onProgress(completed, filePaths.length, filePath);
        }
        
        throw error;
      }
    })
  );
  
  await Promise.allSettled(tasks);
  
  return results;
}

/**
 * Process invoices in batches
 */
export async function processBatch(
  filePaths: string[],
  batchSize: number = 10
): Promise<InvoiceData[]> {
  const results: InvoiceData[] = [];
  
  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filePaths.length / batchSize)}`);
    
    const batchResults = await readManyInvoices(batch, {
      onProgress: (completed, total, file) => {
        console.log(`  [${completed}/${total}] ${file}`);
      },
      onError: (file, error) => {
        console.error(`  ✗ ${file}: ${error.message}`);
      },
    });
    
    results.push(...batchResults);
  }
  
  return results;
}

