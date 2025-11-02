import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency (PLN)
export function formatCurrency(amount: number | string, currency: string = 'PLN'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
  }).format(num)
}

// Convert currency to PLN synchronously using cached rates (fallback)
export function convertToPLNSync(amount: number, fromCurrency: string): number {
  if (fromCurrency === 'PLN') return amount
  
  // Fallback exchange rates if API is unavailable
  const exchangeRates: Record<string, number> = {
    'EUR': 4.30, // 1 EUR ≈ 4.30 PLN
    'USD': 4.00, // 1 USD ≈ 4.00 PLN
    'GBP': 5.10, // 1 GBP ≈ 5.10 PLN
  }
  
  const rate = exchangeRates[fromCurrency] || 1
  return amount * rate
}

// Format amount with currency conversion info (synchronous version)
export function formatCurrencyWithConversion(amount: number, currency: string): string {
  if (currency === 'PLN') {
    return formatCurrency(amount, 'PLN')
  }
  
  const plnAmount = convertToPLNSync(amount, currency)
  const originalFormatted = formatCurrency(amount, currency)
  const plnFormatted = formatCurrency(plnAmount, 'PLN')
  
  return `${plnFormatted} (${originalFormatted})`
}

// Parse string to number
export function parseDecimal(value: string): number {
  return parseFloat(value) || 0
}

// Format date
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (format === 'long') {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d)
  }
  return new Intl.DateTimeFormat('pl-PL').format(d)
}

// Generate invoice number from template
export function generateInvoiceNumber(
  template: string,
  sequenceNumber: number,
  date: Date = new Date()
): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const nr = String(sequenceNumber).padStart(3, '0')

  return template
    .replace('{{YYYY}}', String(year))
    .replace('{{MM}}', month)
    .replace('{{NR}}', nr)
}

// Calculate VAT amount
export function calculateVat(net: number | string, vatRate: string): number {
  const netAmount = typeof net === 'string' ? parseDecimal(net) : net

  if (vatRate === 'zw' || vatRate === '0') {
    return 0
  }

  const rate = parseFloat(vatRate) / 100
  return netAmount * rate
}

// Calculate line totals for invoice item
export function calculateLineItem(
  quantity: number | string,
  netPrice: number | string,
  vatRate: string,
  discount: number | string = 0
) {
  const qty = typeof quantity === 'string' ? parseDecimal(quantity) : quantity
  const price = typeof netPrice === 'string' ? parseDecimal(netPrice) : netPrice
  const disc = typeof discount === 'string' ? parseDecimal(discount) : discount

  const lineNet = qty * price * (1 - disc / 100)
  const lineVat = calculateVat(lineNet, vatRate)
  const lineGross = lineNet + lineVat

  return {
    lineNet: lineNet.toFixed(2),
    lineVat: lineVat.toFixed(2),
    lineGross: lineGross.toFixed(2),
  }
}

// Slugify for project names
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}




