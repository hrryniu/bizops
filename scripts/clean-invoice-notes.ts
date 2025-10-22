/**
 * Script to clean duplicate notes from existing invoices in the database
 * Run with: npx tsx scripts/clean-invoice-notes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function cleanNotes(text: string): string {
  if (!text) return text
  
  let cleanText = text.trim()
  
  // Try to detect and remove repeating patterns
  const words = cleanText.split(/\s+/)
  if (words.length > 10) {
    // For longer texts, try to find if first half repeats in second half
    const halfLength = Math.floor(words.length / 2)
    const firstHalf = words.slice(0, halfLength).join(' ')
    const remaining = words.slice(halfLength).join(' ')
    
    // If first part appears again in the remaining text, it's likely a duplicate
    if (remaining.includes(firstHalf.substring(0, Math.min(50, firstHalf.length)))) {
      return firstHalf
    }
  }
  
  // Also check for simpler repetitions (same text repeated twice)
  const possibleDuplicateLength = Math.floor(cleanText.length / 2)
  for (let len = possibleDuplicateLength; len >= 20; len--) {
    const firstPart = cleanText.substring(0, len).trim()
    const secondPart = cleanText.substring(len).trim()
    
    // Check if second part starts with first part
    if (secondPart.startsWith(firstPart.substring(0, Math.min(30, firstPart.length)))) {
      return firstPart
    }
  }
  
  return cleanText
}

async function main() {
  console.log('🔍 Searching for invoices with duplicate notes...')
  
  const invoices = await prisma.invoice.findMany({
    where: {
      notes: {
        not: null
      }
    },
    select: {
      id: true,
      number: true,
      notes: true
    }
  })
  
  console.log(`📋 Found ${invoices.length} invoices with notes`)
  
  let updatedCount = 0
  
  for (const invoice of invoices) {
    const cleanedNotes = cleanNotes(invoice.notes!)
    
    // Only update if notes actually changed
    if (cleanedNotes !== invoice.notes) {
      console.log(`\n🔧 Cleaning invoice ${invoice.number}`)
      console.log(`   Before: ${invoice.notes?.substring(0, 100)}...`)
      console.log(`   After:  ${cleanedNotes.substring(0, 100)}...`)
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { notes: cleanedNotes }
      })
      
      updatedCount++
    }
  }
  
  console.log(`\n✅ Done! Updated ${updatedCount} invoice(s)`)
  
  if (updatedCount === 0) {
    console.log('✨ No duplicates found - all invoices are clean!')
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

