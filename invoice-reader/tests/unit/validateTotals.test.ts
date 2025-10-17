import { describe, it, expect } from 'vitest';
import { InvoicePosition, InvoiceData } from '../../src/types.js';
import { validateInvoiceData } from '../../src/parse/validate.js';

describe('Totals Validation', () => {
  it('should validate matching totals', () => {
    const positions: InvoicePosition[] = [
      {
        name: 'Item 1',
        quantity: 1,
        net: { value: 100, currency: 'PLN' },
        vat: { value: 23, currency: 'PLN' },
        gross: { value: 123, currency: 'PLN' },
      },
      {
        name: 'Item 2',
        quantity: 2,
        net: { value: 200, currency: 'PLN' },
        vat: { value: 46, currency: 'PLN' },
        gross: { value: 246, currency: 'PLN' },
      },
    ];
    
    const data: InvoiceData = {
      sourceFile: 'test.pdf',
      provider: 'tesseract',
      confidence: 0.8,
      meta: { pages: 1 },
      seller: {},
      positions,
      totals: {
        net: { value: 300, currency: 'PLN' },
        vat: { value: 69, currency: 'PLN' },
        gross: { value: 369, currency: 'PLN' },
      },
      currency: 'PLN',
      rawText: '',
      fields: [],
      validations: [],
    };
    
    validateInvoiceData(data);
    
    const totalsValidation = data.validations.find(v => v.name === 'TOTALS_MATCH');
    expect(totalsValidation).toBeDefined();
    expect(totalsValidation?.ok).toBe(true);
  });
  
  it('should detect mismatched totals', () => {
    const positions: InvoicePosition[] = [
      {
        name: 'Item 1',
        net: { value: 100, currency: 'PLN' },
        vat: { value: 23, currency: 'PLN' },
        gross: { value: 123, currency: 'PLN' },
      },
    ];
    
    const data: InvoiceData = {
      sourceFile: 'test.pdf',
      provider: 'tesseract',
      confidence: 0.8,
      meta: { pages: 1 },
      seller: {},
      positions,
      totals: {
        net: { value: 200, currency: 'PLN' }, // Mismatch!
        vat: { value: 46, currency: 'PLN' },
        gross: { value: 246, currency: 'PLN' },
      },
      currency: 'PLN',
      rawText: '',
      fields: [],
      validations: [],
    };
    
    validateInvoiceData(data);
    
    const totalsValidation = data.validations.find(v => v.name === 'TOTALS_MATCH');
    expect(totalsValidation).toBeDefined();
    expect(totalsValidation?.ok).toBe(false);
  });
  
  it('should handle tolerance for rounding errors', () => {
    const positions: InvoicePosition[] = [
      {
        name: 'Item 1',
        net: { value: 33.33, currency: 'PLN' },
        vat: { value: 7.67, currency: 'PLN' },
        gross: { value: 41.00, currency: 'PLN' },
      },
      {
        name: 'Item 2',
        net: { value: 33.33, currency: 'PLN' },
        vat: { value: 7.67, currency: 'PLN' },
        gross: { value: 41.00, currency: 'PLN' },
      },
      {
        name: 'Item 3',
        net: { value: 33.34, currency: 'PLN' },
        vat: { value: 7.66, currency: 'PLN' },
        gross: { value: 41.00, currency: 'PLN' },
      },
    ];
    
    const data: InvoiceData = {
      sourceFile: 'test.pdf',
      provider: 'tesseract',
      confidence: 0.8,
      meta: { pages: 1 },
      seller: {},
      positions,
      totals: {
        net: { value: 100, currency: 'PLN' },
        vat: { value: 23, currency: 'PLN' },
        gross: { value: 123, currency: 'PLN' },
      },
      currency: 'PLN',
      rawText: '',
      fields: [],
      validations: [],
    };
    
    validateInvoiceData(data);
    
    const totalsValidation = data.validations.find(v => v.name === 'TOTALS_MATCH');
    expect(totalsValidation).toBeDefined();
    expect(totalsValidation?.ok).toBe(true);
  });
});


