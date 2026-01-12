import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

/**
 * Secure encryption/decryption utilities for sensitive data like auto-login tokens
 * Uses AES-256-GCM for authenticated encryption
 */

// Get encryption key from environment or generate a default one for development
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  const isProduction = process.env.NODE_ENV === 'production'

  // CRITICAL: Require encryption key in production
  if (!key) {
    if (isProduction) {
      throw new Error(
        '🚨 CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is REQUIRED in production!\n' +
          "Generate a secure key using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n" +
          'Then set it in your .env file: ENCRYPTION_KEY=your_generated_key_here',
      )
    }

    console.warn('⚠️  ENCRYPTION_KEY not set in environment variables. Using development key.')
    console.warn('⚠️  DO NOT USE IN PRODUCTION!')
    // Use unique salt based on PAYLOAD_SECRET for development
    const devSalt = process.env.PAYLOAD_SECRET || 'dev-salt-change-me'
    const defaultKey = scryptSync('default-dev-key-change-in-production', devSalt, 32)
    return defaultKey
  }

  // Validate encryption key
  if (!key || key.length === 0) {
    throw new Error('ENCRYPTION_KEY cannot be empty')
  }

  // If key is provided as hex string (recommended), convert to buffer
  if (key.length === 64) {
    const hexKey = Buffer.from(key, 'hex')
    if (hexKey.length !== 32) {
      throw new Error(`Invalid encryption key: hex string must be 64 characters (32 bytes)`)
    }
    return hexKey
  }

  // Otherwise, derive key from string using scrypt with proper salt
  const salt = process.env.ENCRYPTION_SALT || 'auto-login-encryption-salt-v1'
  if (!salt || salt.length < 8) {
    throw new Error('ENCRYPTION_SALT must be at least 8 characters long')
  }

  const derivedKey = scryptSync(key, salt, 32)

  // Ensure we have exactly 32 bytes
  if (derivedKey.length !== 32) {
    throw new Error(`Invalid key length: expected 32 bytes, got ${derivedKey.length}`)
  }

  return derivedKey
}

export interface AutoLoginData {
  userId: string
  email: string
  bookingId: string
  timestamp: number
  expires: number
  type: 'event' | 'tour'
}

/**
 * Encrypts sensitive data for auto-login URLs
 * @param data - The data to encrypt
 * @returns Encrypted token as base64 string
 */
export function encryptAutoLoginToken(data: AutoLoginData): string {
  try {
    const key = getEncryptionKey()
    const iv = randomBytes(16) // 128-bit IV for GCM
    const cipher = createCipheriv('aes-256-gcm', key, iv)

    const plaintext = JSON.stringify(data)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Combine IV, auth tag, and encrypted data
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')])

    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt token')
  }
}

/**
 * Decrypts and validates auto-login token
 * @param encryptedToken - The encrypted token to decrypt
 * @returns Decrypted and validated data
 */
export function decryptAutoLoginToken(encryptedToken: string): AutoLoginData {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedToken, 'base64')

    // Extract components
    const iv = combined.subarray(0, 16) // First 16 bytes
    const authTag = combined.subarray(16, 32) // Next 16 bytes
    const encrypted = combined.subarray(32) // Rest is encrypted data

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    const data = JSON.parse(decrypted) as AutoLoginData

    // Validate token structure
    if (!data.userId || !data.email || !data.bookingId || !data.timestamp || !data.expires) {
      throw new Error('Invalid token structure')
    }

    // Check if token is expired
    if (Date.now() > data.expires) {
      throw new Error('Token has expired')
    }

    // Check if token is too old (prevent replay attacks)
    const tokenAge = Date.now() - data.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    if (tokenAge > maxAge) {
      throw new Error('Token is too old')
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt token')
  }
}

/**
 * Creates a secure auto-login token with expiration
 * @param userId - User ID
 * @param email - User email
 * @param bookingId - Booking ID
 * @param type - Booking type (event or tour)
 * @param expiresInMinutes - Token expiration in minutes (default: 60)
 * @returns Encrypted token
 */
export function createAutoLoginToken(
  userId: string,
  email: string,
  bookingId: string,
  type: 'event' | 'tour' = 'event',
  expiresInMinutes: number = 60,
): string {
  const now = Date.now()
  const data: AutoLoginData = {
    userId,
    email,
    bookingId,
    type,
    timestamp: now,
    expires: now + expiresInMinutes * 60 * 1000,
  }

  return encryptAutoLoginToken(data)
}

/**
 * Validates an auto-login token and returns the data if valid
 * @param token - The encrypted token to validate
 * @param expectedUserId - Expected user ID (optional)
 * @param expectedEmail - Expected email (optional)
 * @param expectedBookingId - Expected booking ID (optional)
 * @returns Validated token data or throws error
 */
export function validateAutoLoginToken(
  token: string,
  expectedUserId?: string,
  expectedEmail?: string,
  expectedBookingId?: string,
): AutoLoginData {
  const data = decryptAutoLoginToken(token)

  // Additional validation checks
  if (expectedUserId && data.userId !== expectedUserId) {
    throw new Error('Token user ID mismatch')
  }

  if (expectedEmail && data.email !== expectedEmail) {
    throw new Error('Token email mismatch')
  }

  if (expectedBookingId && data.bookingId !== expectedBookingId) {
    throw new Error('Token booking ID mismatch')
  }

  return data
}

/**
 * Generate a new encryption key for production use
 * This should be run once and the key stored securely
 * @returns 32-byte hex string suitable for ENCRYPTION_KEY environment variable
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Generate a cryptographically secure session token for one-time use
 * @returns Random 64-character hex string
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}
