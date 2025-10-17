export type Money = {
  value: number;
  currency: string;
};

export interface InvoicePosition {
  name: string;
  quantity?: number;
  unit?: string;
  unitPrice?: Money;
  vatRate?: string;
  net?: Money;
  vat?: Money;
  gross?: Money;
}

export interface VatBreakdown {
  rate: string;
  net: Money;
  vat: Money;
  gross: Money;
}

export interface InvoiceTotals {
  net?: Money;
  vat?: Money;
  gross?: Money;
  byVat?: VatBreakdown[];
}

export interface InvoiceParty {
  name?: string;
  nip?: string;
  address?: string;
}

export interface InvoiceField {
  label: string;
  value: string;
  bbox?: [number, number, number, number];
  page?: number;
  confidence?: number;
}

export interface InvoiceValidation {
  name: string;
  ok: boolean;
  details?: string;
}

export type OCRProvider = 'builtin-pdf' | 'tesseract' | 'gcv' | 'textract';

export interface InvoiceData {
  sourceFile: string;
  provider: OCRProvider;
  confidence: number;
  meta: {
    pages: number;
    ocrMs?: number;
    parsedMs?: number;
  };
  seller: InvoiceParty;
  buyer?: InvoiceParty;
  invoiceNumber?: string;
  issueDate?: string;
  saleDate?: string;
  positions?: InvoicePosition[];
  totals?: InvoiceTotals;
  currency?: string;
  rawText: string;
  fields: InvoiceField[];
  validations: InvoiceValidation[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  fields?: InvoiceField[];
  timeMs: number;
  provider: OCRProvider;
}

export interface PDFTextResult {
  text: string;
  hasTextLayer: boolean;
  pages: number;
}

export class NoTextLayerError extends Error {
  constructor(message = 'PDF has no text layer') {
    super(message);
    this.name = 'NoTextLayerError';
  }
}


