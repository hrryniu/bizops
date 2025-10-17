import { InvoicePosition, Money } from '../types.js';
import { parsePolishAmount, normalizeVATRate } from './polish.js';

/**
 * Detect and extract invoice line items from text
 */
export function detectLineItems(text: string, currency: string): InvoicePosition[] {
  const positions: InvoicePosition[] = [];
  
  // Split text into lines
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // Find table header
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (
      (line.includes('lp') || line.includes('no.')) &&
      (line.includes('nazwa') || line.includes('name') || line.includes('description')) &&
      (line.includes('cena') || line.includes('price') || line.includes('kwota') || line.includes('amount'))
    ) {
      tableStartIndex = i + 1;
      break;
    }
  }
  
  if (tableStartIndex === -1) {
    // Try alternative approach: find lines with amounts and VAT rates
    return detectLineItemsHeuristic(text, currency);
  }
  
  // Process table rows
  for (let i = tableStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop at summary section
    if (
      line.toLowerCase().includes('razem') ||
      line.toLowerCase().includes('total') ||
      line.toLowerCase().includes('suma')
    ) {
      break;
    }
    
    // Try to parse line as invoice position
    const position = parseLineItem(line, currency);
    if (position) {
      positions.push(position);
    }
  }
  
  return positions;
}

/**
 * Parse a single line item
 */
function parseLineItem(line: string, currency: string): InvoicePosition | null {
  // Extract numbers from line
  const amounts = line.match(/\d+[,\.\s]\d+|\d+/g);
  if (!amounts || amounts.length < 2) {
    return null;
  }
  
  // Extract VAT rate
  const vatMatch = line.match(/(\d+)\s*%/);
  const vatRate = vatMatch ? `${vatMatch[1]}%` : undefined;
  
  // Parse amounts
  const parsedAmounts = amounts.map(a => parsePolishAmount(a)).filter((a): a is number => a !== null);
  
  if (parsedAmounts.length === 0) {
    return null;
  }
  
  // Extract name (text before first number)
  const firstNumberIndex = line.search(/\d/);
  const name = firstNumberIndex > 0 ? line.substring(0, firstNumberIndex).trim() : line;
  
  // Build position object
  const position: InvoicePosition = {
    name,
  };
  
  // Try to identify fields based on typical structure
  if (parsedAmounts.length >= 1) {
    position.quantity = parsedAmounts[0];
  }
  
  if (parsedAmounts.length >= 2) {
    position.unitPrice = { value: parsedAmounts[1], currency };
  }
  
  if (parsedAmounts.length >= 3) {
    position.net = { value: parsedAmounts[parsedAmounts.length - 3], currency };
  }
  
  if (parsedAmounts.length >= 2) {
    position.gross = { value: parsedAmounts[parsedAmounts.length - 1], currency };
  }
  
  if (vatRate) {
    position.vatRate = vatRate;
  }
  
  return position;
}

/**
 * Heuristic approach: find lines that look like invoice items
 */
function detectLineItemsHeuristic(text: string, currency: string): InvoicePosition[] {
  const positions: InvoicePosition[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Line should contain:
    // - At least one amount
    // - Possibly a VAT rate
    // - Some descriptive text
    
    const hasAmount = /\d+[,\.]\d{2}/.test(line);
    const hasVAT = /\d+\s*%/.test(line);
    const hasText = /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]{3,}/.test(line);
    
    if (hasAmount && hasText) {
      const position = parseLineItem(line, currency);
      if (position && position.name.length > 3) {
        positions.push(position);
      }
    }
  }
  
  return positions;
}


