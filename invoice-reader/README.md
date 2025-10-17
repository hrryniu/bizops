# Invoice Reader

Fast and reliable invoice data extraction from PDF/JPG/PNG files with Polish tax system support.

## Features

- **Hybrid Processing**: Digital PDF text extraction + OCR for scanned documents
- **Multi-Provider OCR**: Local (Tesseract), Google Cloud Vision, AWS Textract
- **Polish Tax Support**: NIP validation, Polish VAT rates, date/amount parsing
- **Smart Validation**: Checksum verification, totals matching, field detection
- **Background Processing**: Concurrent batch processing with configurable limits
- **Caching**: Automatic result caching based on file hash
- **CLI Tool**: Command-line interface for quick testing and benchmarking

## Installation

```bash
cd invoice-reader
npm install
npm run build
```

Make CLI globally available:

```bash
npm link
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# OCR Provider
OCR_PROVIDER=local          # local, gcv, textract
OCR_LANG=pol+eng            # Tesseract languages
CONCURRENCY=4               # Max concurrent files

# Google Cloud Vision (optional)
GCV_PROJECT_ID=your-project
GCV_KEYFILE=path/to/keyfile.json

# AWS Textract (optional)
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Usage

### CLI

**Read single invoice:**

```bash
invoice-reader read invoice.pdf
```

**Benchmark multiple invoices:**

```bash
invoice-reader bench ./invoices-folder
```

### Programmatic API

```typescript
import { readInvoice, readManyInvoices } from 'invoice-reader';

// Single invoice
const data = await readInvoice('invoice.pdf');
console.log(data);

// Multiple invoices with progress
const results = await readManyInvoices(['inv1.pdf', 'inv2.jpg'], {
  concurrency: 4,
  onProgress: (completed, total, file) => {
    console.log(`${completed}/${total}: ${file}`);
  },
  onError: (file, error) => {
    console.error(`Failed ${file}:`, error.message);
  },
});
```

### Background Queue Processing

```typescript
import { processBatch } from 'invoice-reader';

const files = [/* list of file paths */];
const results = await processBatch(files, 10); // Process in batches of 10
```

## Output Format

```typescript
{
  sourceFile: "invoice.pdf",
  provider: "builtin-pdf",    // or "tesseract", "gcv", "textract"
  confidence: 0.92,            // 0-1 confidence score
  meta: {
    pages: 1,
    ocrMs: 1234,              // OCR time in milliseconds
    parsedMs: 56              // Parsing time in milliseconds
  },
  seller: {
    name: "Test Firma Sp. z o.o.",
    nip: "1234563218",        // Validated Polish NIP
    address: "ul. Testowa 1, 00-001 Warszawa"
  },
  buyer: {
    name: "Klient Sp. z o.o.",
    nip: "5260250995",
    address: "ul. Przykładowa 2"
  },
  invoiceNumber: "FV/2025/001",
  issueDate: "2025-10-15",    // ISO format
  saleDate: "2025-10-15",
  positions: [
    {
      name: "Usługa projektowa",
      quantity: 1,
      unit: "szt",
      unitPrice: { value: 5000, currency: "PLN" },
      vatRate: "23%",
      net: { value: 5000, currency: "PLN" },
      vat: { value: 1150, currency: "PLN" },
      gross: { value: 6150, currency: "PLN" }
    }
  ],
  totals: {
    net: { value: 5000, currency: "PLN" },
    vat: { value: 1150, currency: "PLN" },
    gross: { value: 6150, currency: "PLN" }
  },
  currency: "PLN",
  rawText: "...",             // Full extracted text
  fields: [...],              // Extracted fields with metadata
  validations: [
    {
      name: "SELLER_NIP_CHECK",
      ok: true,
      details: "Seller NIP is valid"
    },
    {
      name: "TOTALS_MATCH",
      ok: true,
      details: "Position totals match invoice totals"
    }
  ]
}
```

## OCR Providers

### Local (Tesseract)

Default, works offline. No additional setup required.

**Pros:** Free, offline, no API limits
**Cons:** Slower than cloud solutions (~8-12s per page)

### Google Cloud Vision

High accuracy, fast processing.

**Setup:**

1. Create GCP project and enable Vision API
2. Download service account key
3. Set environment variables:

```env
OCR_PROVIDER=gcv
GCV_PROJECT_ID=your-project
GCV_KEYFILE=./path/to/keyfile.json
```

**Pros:** High accuracy, fast (~1-3s)
**Cons:** Requires internet, costs money

### AWS Textract

Specialized for invoices and receipts.

**Setup:**

```env
OCR_PROVIDER=textract
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

**Pros:** Invoice-specific features, extracts structured data
**Cons:** Requires internet, costs money

## Polish Tax System Support

### NIP Validation

Automatic validation of Polish tax identification numbers (NIP) with checksum algorithm:

```typescript
import { validateNIP } from 'invoice-reader';

validateNIP('123-456-32-18'); // true
validateNIP('1234567890');     // false (invalid checksum)
```

### VAT Rates

Recognizes standard Polish VAT rates: 0%, 5%, 8%, 23%, zw (exempt), np (not applicable)

### Date Formats

Parses common Polish date formats: `dd.mm.yyyy`, `dd-mm-yyyy`, converts to ISO `yyyy-mm-dd`

### Amount Parsing

Handles Polish decimal separator (comma) and currency symbols (zł, PLN, złotych)

## Performance

**Typical processing times (on standard laptop):**

- Digital PDF (text layer): 1-2 seconds
- Scanned PDF/Image (Tesseract): 8-12 seconds per page
- Cloud OCR (GCV/Textract): 1-3 seconds

**Optimization tips:**

- Use `concurrency` for batch processing
- Results are automatically cached
- Digital PDFs bypass OCR for better speed
- Consider cloud providers for production workloads

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate sample invoices
npm test -- tests/sample-data/genSamples.test.ts
```

Sample invoices are generated in `tests/sample-data/generated/`

## Troubleshooting

### Blurry scans

- Use higher DPI in scan settings (300-400 DPI recommended)
- Enable preprocessing: `IMAGE_ENHANCE=true`
- Consider cloud OCR for better accuracy

### Photos with perspective

- Scan documents flat or use document scanner apps
- Crop to invoice boundaries before processing
- Use cloud OCR which handles perspective better

### Large PDFs (100+ pages)

- Process in batches with `processBatch()`
- Increase `CONCURRENCY` for faster processing
- Consider splitting PDF into smaller files

### Low confidence scores

- Check if NIP is correctly recognized (adds 0.2 to confidence)
- Verify totals match (adds 0.2 to confidence)
- Ensure invoice number and dates are found
- Try different OCR provider

### OCR errors

**"No text detected":** PDF may be corrupted, try re-saving
**"MODULE_NOT_FOUND" for worker-script:** Rebuild project with `npm run build`
**Tesseract language error:** Check `OCR_LANG` setting, ensure languages are installed

## Architecture

```
src/
├── pdf/
│   ├── extractText.ts      # Extract text from digital PDFs
│   └── rasterize.ts        # Convert PDF to images for OCR
├── ocr/
│   ├── localTesseract.ts   # Tesseract OCR
│   ├── gcv.ts              # Google Cloud Vision
│   ├── textract.ts         # AWS Textract
│   └── preprocess.ts       # Image enhancement
├── parse/
│   ├── extractFields.ts    # Field extraction (invoice #, dates, parties)
│   ├── detectTables.ts     # Line items detection
│   ├── polish.ts           # Polish-specific parsing (NIP, VAT, amounts)
│   ├── normalize.ts        # Data normalization
│   └── validate.ts         # Validation and confidence scoring
├── queue.ts                # Background batch processing
├── index.ts                # Main entry point
└── types.ts                # TypeScript definitions
```

## License

MIT

## Contributing

Pull requests welcome! Please ensure tests pass and add new tests for features.

## Support

For issues and feature requests, please open a GitHub issue.


