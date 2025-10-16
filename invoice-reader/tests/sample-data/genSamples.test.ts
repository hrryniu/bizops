import { describe, it, expect, beforeAll } from 'vitest';
import PDFDocument from 'pdfkit';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const SAMPLES_DIR = path.join(__dirname, 'generated');

describe('Sample Invoice Generator', () => {
  beforeAll(async () => {
    // Create samples directory
    await fs.mkdir(SAMPLES_DIR, { recursive: true });
  });
  
  it('should generate digital PDF invoice', async () => {
    const pdfPath = path.join(SAMPLES_DIR, 'sample-digital.pdf');
    
    await generateDigitalPDF(pdfPath);
    
    // Verify file exists
    const stats = await fs.stat(pdfPath);
    expect(stats.size).toBeGreaterThan(0);
  });
  
  it('should generate scanned PDF invoice', async () => {
    const pdfPath = path.join(SAMPLES_DIR, 'sample-scan.pdf');
    
    // First generate image
    const imagePath = path.join(SAMPLES_DIR, 'sample-scan.png');
    await generateInvoiceImage(imagePath);
    
    // Convert to PDF (as scanned document)
    await generateScannedPDF(pdfPath, imagePath);
    
    const stats = await fs.stat(pdfPath);
    expect(stats.size).toBeGreaterThan(0);
  });
  
  it('should generate PNG invoice', async () => {
    const imagePath = path.join(SAMPLES_DIR, 'sample-image.png');
    
    await generateInvoiceImage(imagePath);
    
    const stats = await fs.stat(imagePath);
    expect(stats.size).toBeGreaterThan(0);
  });
});

/**
 * Generate digital PDF with text layer
 */
async function generateDigitalPDF(outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fsSync.createWriteStream(outputPath);
    
    doc.pipe(stream);
    
    // Header
    doc.fontSize(20).text('FAKTURA VAT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Nr FV/2025/TEST/001', { align: 'center' });
    doc.moveDown(2);
    
    // Seller
    doc.fontSize(10).text('Sprzedawca:', { underline: true });
    doc.text('Test Firma Sp. z o.o.');
    doc.text('NIP: 123-456-32-18');
    doc.text('ul. Testowa 1');
    doc.text('00-001 Warszawa');
    doc.moveDown();
    
    // Buyer
    doc.text('Nabywca:', { underline: true });
    doc.text('Klient Sp. z o.o.');
    doc.text('NIP: 526-025-09-95');
    doc.text('ul. Przykładowa 2');
    doc.text('00-002 Kraków');
    doc.moveDown();
    
    // Dates
    doc.text('Data wystawienia: 15.10.2025');
    doc.text('Data sprzedaży: 15.10.2025');
    doc.text('Termin płatności: 29.10.2025');
    doc.moveDown(2);
    
    // Table
    doc.fontSize(9);
    const tableTop = doc.y;
    doc.text('Lp.', 50, tableTop);
    doc.text('Nazwa', 80, tableTop);
    doc.text('Ilość', 250, tableTop);
    doc.text('Cena netto', 300, tableTop);
    doc.text('VAT', 380, tableTop);
    doc.text('Wartość brutto', 430, tableTop);
    
    doc.moveDown();
    const itemY = doc.y;
    doc.text('1', 50, itemY);
    doc.text('Usługa projektowa', 80, itemY);
    doc.text('1 szt', 250, itemY);
    doc.text('5 000,00', 300, itemY);
    doc.text('23%', 380, itemY);
    doc.text('6 150,00', 430, itemY);
    
    doc.moveDown(3);
    
    // Totals
    doc.fontSize(10);
    doc.text('Razem netto: 5 000,00 PLN', { align: 'right' });
    doc.text('VAT (23%): 1 150,00 PLN', { align: 'right' });
    doc.fontSize(12).text('Razem brutto: 6 150,00 PLN', { align: 'right', underline: true });
    
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Generate invoice image
 */
async function generateInvoiceImage(outputPath: string): Promise<void> {
  const width = 800;
  const height = 1100;
  
  // Create SVG invoice
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white"/>
      
      <text x="400" y="60" font-size="24" font-weight="bold" text-anchor="middle">FAKTURA VAT</text>
      <text x="400" y="90" font-size="14" text-anchor="middle">Nr FV/2025/TEST/002</text>
      
      <text x="50" y="150" font-size="12" font-weight="bold">Sprzedawca:</text>
      <text x="50" y="170" font-size="11">Test Firma Sp. z o.o.</text>
      <text x="50" y="190" font-size="11">NIP: 123-456-32-18</text>
      <text x="50" y="210" font-size="11">ul. Testowa 1, 00-001 Warszawa</text>
      
      <text x="400" y="150" font-size="12" font-weight="bold">Nabywca:</text>
      <text x="400" y="170" font-size="11">Klient Sp. z o.o.</text>
      <text x="400" y="190" font-size="11">NIP: 526-025-09-95</text>
      <text x="400" y="210" font-size="11">ul. Przykładowa 2, 00-002 Kraków</text>
      
      <text x="50" y="260" font-size="11">Data wystawienia: 15.10.2025</text>
      <text x="50" y="280" font-size="11">Data sprzedaży: 15.10.2025</text>
      
      <rect x="50" y="320" width="700" height="1" fill="#333"/>
      
      <text x="60" y="350" font-size="10" font-weight="bold">Lp.</text>
      <text x="100" y="350" font-size="10" font-weight="bold">Nazwa</text>
      <text x="400" y="350" font-size="10" font-weight="bold">Ilość</text>
      <text x="480" y="350" font-size="10" font-weight="bold">Cena</text>
      <text x="560" y="350" font-size="10" font-weight="bold">VAT</text>
      <text x="640" y="350" font-size="10" font-weight="bold">Brutto</text>
      
      <rect x="50" y="360" width="700" height="1" fill="#333"/>
      
      <text x="60" y="390" font-size="10">1</text>
      <text x="100" y="390" font-size="10">Usługa konsultingowa</text>
      <text x="400" y="390" font-size="10">10 h</text>
      <text x="480" y="390" font-size="10">500,00</text>
      <text x="560" y="390" font-size="10">23%</text>
      <text x="640" y="390" font-size="10">6 150,00</text>
      
      <rect x="50" y="420" width="700" height="1" fill="#333"/>
      
      <text x="550" y="480" font-size="11">Razem netto: 5 000,00 PLN</text>
      <text x="550" y="505" font-size="11">VAT (23%): 1 150,00 PLN</text>
      <text x="550" y="540" font-size="14" font-weight="bold">Razem brutto: 6 150,00 PLN</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

/**
 * Generate scanned PDF (image-only, no text layer)
 */
async function generateScannedPDF(outputPath: string, imagePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4' });
    const stream = fsSync.createWriteStream(outputPath);
    
    doc.pipe(stream);
    
    // Add image without text layer (simulates scan)
    doc.image(imagePath, 0, 0, { width: 595.28, height: 841.89 });
    
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

