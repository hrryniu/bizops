import { describe, it, expect } from 'vitest';
import { validateNIP, extractNIP } from '../../src/parse/polish.js';

describe('NIP Validation', () => {
  it('should validate correct NIPs', () => {
    // Valid NIPs
    expect(validateNIP('1234563218')).toBe(true); // Example valid NIP
    expect(validateNIP('5260250995')).toBe(true); // Another valid NIP
  });
  
  it('should reject invalid NIPs', () => {
    expect(validateNIP('1234567890')).toBe(false);
    expect(validateNIP('1111111110')).toBe(false); // Invalid checksum
  });
  
  it('should handle NIP with formatting', () => {
    expect(validateNIP('123-456-32-18')).toBe(true);
    expect(validateNIP('123 456 32 18')).toBe(true);
  });
  
  it('should reject NIPs with wrong length', () => {
    expect(validateNIP('123456789')).toBe(false); // 9 digits
    expect(validateNIP('12345678901')).toBe(false); // 11 digits
  });
  
  it('should extract NIP from text', () => {
    const text = 'Sprzedawca: Firma XYZ\nNIP: 123-456-32-18\nAdres: ul. Testowa 1';
    const nip = extractNIP(text);
    expect(nip).toBe('1234563218');
  });
  
  it('should handle multiple formats in extraction', () => {
    expect(extractNIP('NIP: 526-025-09-95')).toBe('5260250995');
    expect(extractNIP('Tax ID: PL 5260250995')).toBe('5260250995');
  });
  
  it('should return null when no valid NIP found', () => {
    expect(extractNIP('Firma bez NIP')).toBeNull();
    expect(extractNIP('NIP: 1234567890')).toBeNull(); // Invalid checksum
  });
});

