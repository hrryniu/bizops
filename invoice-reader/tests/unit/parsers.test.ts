import { describe, it, expect } from 'vitest';
import { parsePolishDate, parsePolishAmount, normalizeVATRate } from '../../src/parse/polish.js';
import { extractInvoiceNumber, extractCurrency } from '../../src/parse/extractFields.js';

describe('Polish Date Parser', () => {
  it('should parse dd.mm.yyyy format', () => {
    expect(parsePolishDate('15.10.2025')).toBe('2025-10-15');
    expect(parsePolishDate('01.01.2024')).toBe('2024-01-01');
  });
  
  it('should parse dd-mm-yyyy format', () => {
    expect(parsePolishDate('15-10-2025')).toBe('2025-10-15');
  });
  
  it('should parse yyyy-mm-dd format', () => {
    expect(parsePolishDate('2025-10-15')).toBe('2025-10-15');
  });
  
  it('should return null for invalid dates', () => {
    expect(parsePolishDate('invalid')).toBeNull();
    expect(parsePolishDate('32.13.2025')).toBeNull();
  });
});

describe('Polish Amount Parser', () => {
  it('should parse amounts with comma decimal separator', () => {
    expect(parsePolishAmount('123,45 zł')).toBe(123.45);
    expect(parsePolishAmount('1 000,50 PLN')).toBe(1000.50);
  });
  
  it('should parse amounts with dot decimal separator', () => {
    expect(parsePolishAmount('123.45')).toBe(123.45);
  });
  
  it('should handle thousand separators', () => {
    expect(parsePolishAmount('1 234 567,89 zł')).toBe(1234567.89);
  });
  
  it('should return null for invalid amounts', () => {
    expect(parsePolishAmount('invalid')).toBeNull();
  });
});

describe('VAT Rate Normalizer', () => {
  it('should normalize percentage rates', () => {
    expect(normalizeVATRate('23%')).toBe('23%');
    expect(normalizeVATRate('8 %')).toBe('8%');
    expect(normalizeVATRate('5')).toBe('5%');
  });
  
  it('should recognize special rates', () => {
    expect(normalizeVATRate('zw')).toBe('zw');
    expect(normalizeVATRate('zwolniony')).toBe('zw');
    expect(normalizeVATRate('np')).toBe('np');
  });
});

describe('Invoice Number Extractor', () => {
  it('should extract invoice numbers', () => {
    expect(extractInvoiceNumber('Faktura nr FV/2025/001')).toBe('FV/2025/001');
    expect(extractInvoiceNumber('Invoice no: 123/10/2025')).toBe('123/10/2025');
  });
  
  it('should handle various formats', () => {
    expect(extractInvoiceNumber('nr faktury: FV-123')).toBe('FV-123');
  });
});

describe('Currency Extractor', () => {
  it('should extract currency codes', () => {
    expect(extractCurrency('Total: 1000 PLN')).toBe('PLN');
    expect(extractCurrency('Amount: 500 EUR')).toBe('EUR');
  });
  
  it('should recognize Polish currency words', () => {
    expect(extractCurrency('Razem: 1000 zł')).toBe('PLN');
    expect(extractCurrency('1000 złotych')).toBe('PLN');
  });
  
  it('should default to PLN', () => {
    expect(extractCurrency('Some text without currency')).toBe('PLN');
  });
});


