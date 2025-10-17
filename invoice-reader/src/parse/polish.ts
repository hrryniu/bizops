/**
 * Polish-specific parsing and validation utilities
 */

/**
 * Validate Polish NIP (tax identification number)
 * NIP: 10 digits with checksum algorithm
 */
export function validateNIP(nip: string): boolean {
  // Remove any non-digit characters
  const cleaned = nip.replace(/\D/g, '');
  
  if (cleaned.length !== 10) {
    return false;
  }
  
  // Checksum weights
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }
  
  const checksum = sum % 11;
  
  // Checksum 10 is invalid
  if (checksum === 10) {
    return false;
  }
  
  const lastDigit = parseInt(cleaned[9]);
  return checksum === lastDigit;
}

/**
 * Extract NIP from text
 */
export function extractNIP(text: string): string | null {
  // Common NIP patterns in Polish invoices
  const patterns = [
    /NIP[:\s]+(\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})/i,
    /NIP[:\s]+(\d{10})/i,
    /(?:Tax|VAT)\s*ID[:\s]+PL[\s-]?(\d{10})/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const nip = match[1].replace(/\D/g, '');
      if (validateNIP(nip)) {
        return nip;
      }
    }
  }
  
  // Try to find any 10-digit sequence that validates
  const allDigits = text.match(/\d{10}/g);
  if (allDigits) {
    for (const digits of allDigits) {
      if (validateNIP(digits)) {
        return digits;
      }
    }
  }
  
  return null;
}

/**
 * Parse Polish date formats
 */
export function parsePolishDate(dateStr: string): string | null {
  // Common Polish date formats: dd.mm.yyyy, dd-mm-yyyy, dd/mm/yyyy
  const patterns = [
    /(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})/,
    /(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})/,
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let [, part1, part2, part3] = match;
      
      // Determine if it's dd.mm.yyyy or yyyy.mm.dd
      const year = part3.length === 4 ? part3 : part1;
      const month = part3.length === 4 ? part2 : part2;
      const day = part3.length === 4 ? part1 : part3;
      
      // Pad with zeros
      const paddedMonth = month.padStart(2, '0');
      const paddedDay = day.padStart(2, '0');
      
      // Validate date
      const monthNum = parseInt(paddedMonth);
      const dayNum = parseInt(paddedDay);
      
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
    }
  }
  
  return null;
}

/**
 * Normalize Polish currency amounts
 */
export function parsePolishAmount(amountStr: string): number | null {
  // Remove common Polish currency symbols and text
  let cleaned = amountStr
    .replace(/zł|PLN|złotych|złote|złoty/gi, '')
    .replace(/\s/g, '')
    .trim();
  
  // Replace comma with dot (Polish decimal separator)
  cleaned = cleaned.replace(',', '.');
  
  // Remove thousand separators (spaces or apostrophes)
  cleaned = cleaned.replace(/['\s]/g, '');
  
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Common Polish VAT rates
 */
export const POLISH_VAT_RATES = ['0%', '5%', '8%', '23%', 'zw', 'np', 'oo'];

/**
 * Normalize VAT rate string
 */
export function normalizeVATRate(rateStr: string): string {
  const cleaned = rateStr.toLowerCase().trim();
  
  // Extract percentage
  const match = cleaned.match(/(\d+)\s*%?/);
  if (match) {
    return `${match[1]}%`;
  }
  
  // Special rates
  if (cleaned.includes('zw') || cleaned.includes('zwol')) {
    return 'zw';
  }
  if (cleaned.includes('np') || cleaned.includes('nie')) {
    return 'np';
  }
  if (cleaned.includes('oo')) {
    return 'oo';
  }
  
  return rateStr;
}


