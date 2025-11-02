/**
 * 🔐 Encryption Utility
 * 
 * Secure encryption/decryption for sensitive data like bank tokens and credentials.
 * Uses AES-256-CBC encryption with configurable keys.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32'
const IV_LENGTH = 16

/**
 * Ensures the encryption key is exactly 32 bytes
 */
function getKey(): Buffer {
  const key = ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0')
  return Buffer.from(key)
}

/**
 * Encrypts a string value
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return `${iv.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts an encrypted string
 * @param text - Encrypted string in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(text: string): string {
  try {
    const parts = text.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedData = parts[1]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hashes a value using SHA-256
 * @param value - Value to hash
 * @returns Hex-encoded hash
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Generates a random token
 * @param length - Length in bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Securely compares two strings (timing-safe)
 * @param a - First string
 * @param b - Second string
 * @returns True if equal
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)
    
    if (bufferA.length !== bufferB.length) {
      return false
    }
    
    return crypto.timingSafeEqual(bufferA, bufferB)
  } catch {
    return false
  }
}








