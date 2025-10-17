import { InvoiceData, InvoiceValidation, InvoicePosition, Money } from '../types.js';
import { validateNIP } from './polish.js';

/**
 * Validate invoice data and add validation results
 */
export function validateInvoiceData(data: InvoiceData): void {
  const validations: InvoiceValidation[] = [];
  
  // Validate seller NIP
  if (data.seller.nip) {
    const nipValid = validateNIP(data.seller.nip);
    validations.push({
      name: 'SELLER_NIP_CHECK',
      ok: nipValid,
      details: nipValid ? 'Seller NIP is valid' : 'Seller NIP checksum failed',
    });
  }
  
  // Validate buyer NIP
  if (data.buyer?.nip) {
    const nipValid = validateNIP(data.buyer.nip);
    validations.push({
      name: 'BUYER_NIP_CHECK',
      ok: nipValid,
      details: nipValid ? 'Buyer NIP is valid' : 'Buyer NIP checksum failed',
    });
  }
  
  // Validate totals match
  if (data.positions && data.positions.length > 0 && data.totals) {
    const totalsValidation = validateTotals(data.positions, data.totals);
    validations.push(totalsValidation);
  }
  
  // Validate dates
  if (data.issueDate) {
    const dateValid = isValidISODate(data.issueDate);
    validations.push({
      name: 'ISSUE_DATE_FORMAT',
      ok: dateValid,
      details: dateValid ? 'Issue date is valid ISO format' : 'Issue date format is invalid',
    });
  }
  
  if (data.saleDate) {
    const dateValid = isValidISODate(data.saleDate);
    validations.push({
      name: 'SALE_DATE_FORMAT',
      ok: dateValid,
      details: dateValid ? 'Sale date is valid ISO format' : 'Sale date format is invalid',
    });
  }
  
  // Validate invoice number exists
  validations.push({
    name: 'INVOICE_NUMBER_EXISTS',
    ok: !!data.invoiceNumber,
    details: data.invoiceNumber ? 'Invoice number found' : 'Invoice number not found',
  });
  
  data.validations = validations;
}

/**
 * Validate that position totals match invoice totals
 */
function validateTotals(
  positions: InvoicePosition[],
  totals: { net?: Money; vat?: Money; gross?: Money }
): InvoiceValidation {
  const tolerance = 0.01; // 1 cent tolerance
  
  // Calculate sum of positions
  let sumNet = 0;
  let sumVat = 0;
  let sumGross = 0;
  
  for (const pos of positions) {
    if (pos.net) sumNet += pos.net.value;
    if (pos.vat) sumVat += pos.vat.value;
    if (pos.gross) sumGross += pos.gross.value;
  }
  
  // Compare with totals
  const netMatch = !totals.net || Math.abs(sumNet - totals.net.value) <= tolerance;
  const vatMatch = !totals.vat || Math.abs(sumVat - totals.vat.value) <= tolerance;
  const grossMatch = !totals.gross || Math.abs(sumGross - totals.gross.value) <= tolerance;
  
  const allMatch = netMatch && vatMatch && grossMatch;
  
  const details: string[] = [];
  if (!netMatch) details.push(`Net mismatch: ${sumNet.toFixed(2)} vs ${totals.net?.value.toFixed(2)}`);
  if (!vatMatch) details.push(`VAT mismatch: ${sumVat.toFixed(2)} vs ${totals.vat?.value.toFixed(2)}`);
  if (!grossMatch) details.push(`Gross mismatch: ${sumGross.toFixed(2)} vs ${totals.gross?.value.toFixed(2)}`);
  
  return {
    name: 'TOTALS_MATCH',
    ok: allMatch,
    details: allMatch ? 'Position totals match invoice totals' : details.join('; '),
  };
}

/**
 * Validate ISO date format
 */
function isValidISODate(dateStr: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(dateStr)) {
    return false;
  }
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Calculate confidence score
 */
export function calculateConfidence(data: InvoiceData, ocrConfidence: number): number {
  let score = 0;
  let maxScore = 0;
  
  // OCR quality (weight: 0.2)
  score += ocrConfidence * 0.2;
  maxScore += 0.2;
  
  // Seller NIP valid (weight: 0.2)
  if (data.seller.nip) {
    maxScore += 0.2;
    if (validateNIP(data.seller.nip)) {
      score += 0.2;
    }
  }
  
  // Invoice number found (weight: 0.2)
  maxScore += 0.2;
  if (data.invoiceNumber) {
    score += 0.2;
  }
  
  // Dates found (weight: 0.2)
  maxScore += 0.2;
  if (data.issueDate || data.saleDate) {
    score += 0.1;
  }
  if (data.issueDate && data.saleDate) {
    score += 0.1;
  }
  
  // Totals match (weight: 0.2)
  if (data.positions && data.positions.length > 0 && data.totals) {
    maxScore += 0.2;
    const validation = data.validations.find(v => v.name === 'TOTALS_MATCH');
    if (validation?.ok) {
      score += 0.2;
    }
  }
  
  // Normalize to 0-1
  return maxScore > 0 ? Math.min(score / maxScore, 1) : ocrConfidence;
}


