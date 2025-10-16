import { InvoiceData, InvoiceField } from '../types.js';
import {
  extractInvoiceNumber,
  extractDates,
  extractSeller,
  extractBuyer,
  extractCurrency,
  extractTotals,
} from './extractFields.js';
import { detectLineItems } from './detectTables.js';
import { validateInvoiceData, calculateConfidence } from './validate.js';

/**
 * Normalize and structure invoice data from raw text
 */
export function normalizeInvoiceData(
  rawText: string,
  sourceFile: string,
  provider: InvoiceData['provider'],
  ocrConfidence: number,
  meta: InvoiceData['meta']
): InvoiceData {
  const startTime = Date.now();
  
  // Extract basic fields
  const invoiceNumber = extractInvoiceNumber(rawText) || undefined;
  const dates = extractDates(rawText);
  const seller = extractSeller(rawText);
  const buyer = extractBuyer(rawText);
  const currency = extractCurrency(rawText);
  const totals = extractTotals(rawText, currency);
  
  // Extract line items
  const positions = detectLineItems(rawText, currency);
  
  // Build fields array
  const fields: InvoiceField[] = [];
  
  if (invoiceNumber) {
    fields.push({ label: 'invoiceNumber', value: invoiceNumber });
  }
  if (dates.issueDate) {
    fields.push({ label: 'issueDate', value: dates.issueDate });
  }
  if (dates.saleDate) {
    fields.push({ label: 'saleDate', value: dates.saleDate });
  }
  if (seller.name) {
    fields.push({ label: 'seller.name', value: seller.name });
  }
  if (seller.nip) {
    fields.push({ label: 'seller.nip', value: seller.nip });
  }
  if (buyer?.name) {
    fields.push({ label: 'buyer.name', value: buyer.name });
  }
  if (buyer?.nip) {
    fields.push({ label: 'buyer.nip', value: buyer.nip });
  }
  
  // Create invoice data object
  const data: InvoiceData = {
    sourceFile,
    provider,
    confidence: 0, // Will be calculated below
    meta: {
      ...meta,
      parsedMs: Date.now() - startTime,
    },
    seller,
    buyer,
    invoiceNumber,
    issueDate: dates.issueDate,
    saleDate: dates.saleDate,
    positions: positions.length > 0 ? positions : undefined,
    totals,
    currency,
    rawText,
    fields,
    validations: [],
  };
  
  // Validate data
  validateInvoiceData(data);
  
  // Calculate confidence score
  data.confidence = calculateConfidence(data, ocrConfidence);
  
  return data;
}

