import { InvoiceField, InvoiceParty, Money } from '../types.js';
import { extractNIP, parsePolishDate, parsePolishAmount, normalizeVATRate } from './polish.js';

/**
 * Extract invoice number from text
 */
export function extractInvoiceNumber(text: string): string | null {
  const patterns = [
    /(?:Faktura|Invoice|VAT)\s*(?:nr|no|number|#)[:\s]*([A-Z0-9\/\-]+)/i,
    /(?:nr|no)[:\.\s]*faktury[:\s]*([A-Z0-9\/\-]+)/i,
    /FV[\/\-]?(\d+[\/\-]\d+[\/\-]?\d*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract dates from invoice
 */
export function extractDates(text: string): {
  issueDate?: string;
  saleDate?: string;
} {
  const result: { issueDate?: string; saleDate?: string } = {};
  
  // Issue date keywords
  const issueDatePatterns = [
    /(?:data\s+wystawienia|date\s+of\s+issue)[:\s]+([^\n]+)/i,
    /(?:wystawiono|issued)[:\s]+([^\n]+)/i,
  ];
  
  for (const pattern of issueDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      const date = parsePolishDate(match[1]);
      if (date) {
        result.issueDate = date;
        break;
      }
    }
  }
  
  // Sale date keywords
  const saleDatePatterns = [
    /(?:data\s+sprzedaży|date\s+of\s+sale)[:\s]+([^\n]+)/i,
    /(?:sprzedaż|sale)[:\s]+([^\n]+)/i,
  ];
  
  for (const pattern of saleDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      const date = parsePolishDate(match[1]);
      if (date) {
        result.saleDate = date;
        break;
      }
    }
  }
  
  return result;
}

/**
 * Extract seller information
 */
export function extractSeller(text: string): InvoiceParty {
  const seller: InvoiceParty = {};
  
  // Find seller section
  const sellerSection = text.match(/(?:Sprzedawca|Seller|Wystawca)[:\s]+([^\n]+(?:\n[^\n]+){0,5})/i);
  
  if (sellerSection) {
    const section = sellerSection[1];
    
    // Extract NIP
    const nip = extractNIP(section);
    if (nip) seller.nip = nip;
    
    // Extract name (usually first non-empty line)
    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 0) {
      seller.name = lines[0];
    }
    
    // Extract address (lines after name)
    if (lines.length > 1) {
      seller.address = lines.slice(1).join(', ');
    }
  }
  
  return seller;
}

/**
 * Extract buyer information
 */
export function extractBuyer(text: string): InvoiceParty | undefined {
  const buyer: InvoiceParty = {};
  
  // Find buyer section
  const buyerSection = text.match(/(?:Nabywca|Buyer|Klient|Customer)[:\s]+([^\n]+(?:\n[^\n]+){0,5})/i);
  
  if (buyerSection) {
    const section = buyerSection[1];
    
    // Extract NIP
    const nip = extractNIP(section);
    if (nip) buyer.nip = nip;
    
    // Extract name
    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 0) {
      buyer.name = lines[0];
    }
    
    // Extract address
    if (lines.length > 1) {
      buyer.address = lines.slice(1).join(', ');
    }
    
    return buyer;
  }
  
  return undefined;
}

/**
 * Extract currency from text
 */
export function extractCurrency(text: string): string {
  const currencyPatterns = [
    /\b(PLN|EUR|USD|GBP)\b/i,
    /\b(zł|złotych|złote|złoty)\b/i,
  ];
  
  for (const pattern of currencyPatterns) {
    const match = text.match(pattern);
    if (match) {
      const currency = match[1].toUpperCase();
      if (currency === 'ZŁ' || currency.includes('ZŁ')) {
        return 'PLN';
      }
      return currency;
    }
  }
  
  return 'PLN'; // Default to PLN for Polish invoices
}

/**
 * Extract totals from invoice
 */
export function extractTotals(text: string, currency: string): {
  net?: Money;
  vat?: Money;
  gross?: Money;
} | undefined {
  const totals: { net?: Money; vat?: Money; gross?: Money } = {};
  
  // Net total patterns
  const netPatterns = [
    /(?:razem\s+netto|total\s+net|suma\s+netto)[:\s]+([0-9\s,\.]+)/i,
    /(?:netto|net)[:\s]+([0-9\s,\.]+)/i,
  ];
  
  for (const pattern of netPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parsePolishAmount(match[1]);
      if (amount !== null) {
        totals.net = { value: amount, currency };
        break;
      }
    }
  }
  
  // VAT total patterns
  const vatPatterns = [
    /(?:razem\s+vat|total\s+vat|suma\s+vat)[:\s]+([0-9\s,\.]+)/i,
    /(?:podatek|vat|tax)[:\s]+([0-9\s,\.]+)/i,
  ];
  
  for (const pattern of vatPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parsePolishAmount(match[1]);
      if (amount !== null) {
        totals.vat = { value: amount, currency };
        break;
      }
    }
  }
  
  // Gross total patterns
  const grossPatterns = [
    /(?:razem\s+brutto|total\s+gross|suma\s+brutto|do\s+zapłaty)[:\s]+([0-9\s,\.]+)/i,
    /(?:brutto|gross)[:\s]+([0-9\s,\.]+)/i,
  ];
  
  for (const pattern of grossPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parsePolishAmount(match[1]);
      if (amount !== null) {
        totals.gross = { value: amount, currency };
        break;
      }
    }
  }
  
  if (totals.net || totals.vat || totals.gross) {
    return totals;
  }
  
  return undefined;
}

