#!/usr/bin/env node

import { readInvoice, readManyInvoices } from '../dist/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'read':
        await handleRead(args[0]);
        break;
      
      case 'bench':
        await handleBench(args[0]);
        break;
      
      case 'help':
      case '--help':
      case '-h':
      default:
        printHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

async function handleRead(filePath) {
  if (!filePath) {
    console.error('Error: File path required');
    console.error('Usage: invoice-reader read <path>');
    process.exit(1);
  }
  
  console.log(`Reading invoice from ${filePath}...`);
  const startTime = Date.now();
  
  const data = await readInvoice(filePath);
  
  const timeMs = Date.now() - startTime;
  
  console.log('\n' + JSON.stringify(data, null, 2));
  console.log(`\n✓ Completed in ${timeMs}ms`);
}

async function handleBench(folderPath) {
  if (!folderPath) {
    console.error('Error: Folder path required');
    console.error('Usage: invoice-reader bench <folder>');
    process.exit(1);
  }
  
  // Find all PDF/image files in folder
  const files = await fs.readdir(folderPath);
  const invoiceFiles = files.filter(f => 
    f.toLowerCase().endsWith('.pdf') ||
    f.toLowerCase().endsWith('.jpg') ||
    f.toLowerCase().endsWith('.jpeg') ||
    f.toLowerCase().endsWith('.png')
  ).map(f => path.join(folderPath, f));
  
  if (invoiceFiles.length === 0) {
    console.error('No invoice files found in folder');
    process.exit(1);
  }
  
  console.log(`\nBenchmarking ${invoiceFiles.length} invoices...\n`);
  console.log('File'.padEnd(40) + 'Time (ms)'.padEnd(15) + 'Provider'.padEnd(15) + 'Confidence');
  console.log('='.repeat(85));
  
  const times = [];
  let successful = 0;
  
  for (const file of invoiceFiles) {
    const fileName = path.basename(file);
    const startTime = Date.now();
    
    try {
      const data = await readInvoice(file);
      const timeMs = Date.now() - startTime;
      times.push(timeMs);
      successful++;
      
      console.log(
        fileName.padEnd(40) +
        `${timeMs}`.padEnd(15) +
        data.provider.padEnd(15) +
        `${(data.confidence * 100).toFixed(1)}%`
      );
    } catch (error) {
      const timeMs = Date.now() - startTime;
      console.log(
        fileName.padEnd(40) +
        `${timeMs}`.padEnd(15) +
        'ERROR'.padEnd(15) +
        error.message.substring(0, 20)
      );
    }
  }
  
  console.log('='.repeat(85));
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\nResults:`);
    console.log(`  Successful: ${successful}/${invoiceFiles.length}`);
    console.log(`  Average time: ${avgTime.toFixed(0)}ms`);
    console.log(`  Min time: ${minTime}ms`);
    console.log(`  Max time: ${maxTime}ms`);
  }
}

function printHelp() {
  console.log(`
Invoice Reader CLI

Usage:
  invoice-reader read <path>       Read and extract data from single invoice
  invoice-reader bench <folder>    Benchmark multiple invoices in folder
  invoice-reader help              Show this help message

Examples:
  invoice-reader read invoice.pdf
  invoice-reader read scan.jpg
  invoice-reader bench ./invoices

Environment Variables:
  OCR_PROVIDER     OCR provider: local, gcv, textract (default: local)
  OCR_LANG         Tesseract languages (default: pol+eng)
  CONCURRENCY      Max concurrent processing (default: 4)

For more information, see README.md
`);
}

main();


