import { timingSafeEqual } from 'crypto'

/**
 * Security utilities for preventing timing attacks and ensuring consistent behavior
 */

/**
 * Compare two strings in constant time to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  try {
    // Ensure both strings are the same length to prevent timing attacks
    if (a.length !== b.length) {
      // Perform a dummy comparison with equal length strings to maintain constant time
      // Use Uint8Array to satisfy timingSafeEqual's expected types
      const dummyA = new Uint8Array(32)
      const dummyB = new Uint8Array(32)
      timingSafeEqual(dummyA, dummyB)
      return false
    }

    const bufferA = new Uint8Array(Buffer.from(a, 'utf-8'))
    const bufferB = new Uint8Array(Buffer.from(b, 'utf-8'))

    return timingSafeEqual(bufferA, bufferB)
  } catch (_error) {
    return false
  }
}

/**
 * Delays execution to ensure consistent timing regardless of success/failure
 * Prevents timing attacks by making all responses take similar time
 * @param minDelayMs - Minimum delay in milliseconds (default: 100ms)
 */
export async function addTimingDelay(minDelayMs: number = 100): Promise<void> {
  const randomDelay = Math.floor(Math.random() * 50) + minDelayMs // 100-150ms
  await new Promise((resolve) => setTimeout(resolve, randomDelay))
}

/**
 * Generic error response for authentication failures
 * Returns the same error message regardless of the actual failure reason
 * to prevent information leakage
 */
export const GENERIC_AUTH_ERROR = 'Authentication failed. Please try again or contact support.'

/**
 * Rate limiting tracker for preventing brute force attacks
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  resetTime: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, email, etc.)
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(identifier)
  }

  const currentEntry = rateLimitStore.get(identifier)

  if (!currentEntry) {
    // First attempt
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    }
  }

  if (currentEntry.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: currentEntry.resetTime,
    }
  }

  // Increment count
  currentEntry.count++
  rateLimitStore.set(identifier, currentEntry)

  return {
    allowed: true,
    remainingAttempts: maxAttempts - currentEntry.count,
    resetTime: currentEntry.resetTime,
  }
}

/**
 * Clear rate limit for an identifier (use after successful authentication)
 * @param identifier - Unique identifier to clear
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Validate and sanitize user ID to prevent type coercion vulnerabilities
 * @param userId - User ID from any source
 * @returns Validated number or null
 */
export function validateUserId(userId: unknown): number | null {
  if (userId === null || userId === undefined) {
    return null
  }

  // Handle string representation of numbers
  if (typeof userId === 'string') {
    const parsed = parseInt(userId, 10)
    if (isNaN(parsed) || parsed <= 0) {
      return null
    }
    return parsed
  }

  // Handle direct numbers
  if (typeof userId === 'number') {
    if (isNaN(userId) || userId <= 0) {
      return null
    }
    return Math.floor(userId) // Ensure integer
  }

  // Handle objects (like from Payload relationships)
  if (typeof userId === 'object' && userId !== null && 'id' in userId) {
    return validateUserId((userId as { id: unknown }).id)
  }

  return null
}

/**
 * Validate and sanitize email address
 * @param email - Email to validate
 * @returns Sanitized email or null
 */
export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string' || !email) {
    return null
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const trimmed = email.trim().toLowerCase()

  if (!emailRegex.test(trimmed)) {
    return null
  }

  // Length checks
  if (trimmed.length < 3 || trimmed.length > 254) {
    return null
  }

  return trimmed
}

/**
 * Validate booking ID
 * @param bookingId - Booking ID to validate
 * @returns Validated number or null
 */
export function validateBookingId(bookingId: unknown): number | null {
  return validateUserId(bookingId) // Same validation logic
}

/**
 * Sanitize log output to prevent sensitive data leakage
 * @param data - Data to sanitize
 * @returns Sanitized data safe for logging
 */
export function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'sessionToken',
    'secret',
    'apiKey',
    'encryptedToken',
    'authToken',
    'accessToken',
    'refreshToken',
  ]

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()

    // Check if this is a sensitive field
    if (sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLog(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Get client IP address from request headers
 * @param headers - Request headers
 * @returns IP address or 'unknown'
 */
export function getClientIP(headers: Headers): string {
  // Check common headers for IP address (in order of preference)
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'forwarded',
  ]

  for (const header of ipHeaders) {
    const value = headers.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value?.split(',')[0]?.trim()
      if (ip) return ip
    }
  }

  return 'unknown'
}

/**
 * Clean up old rate limit entries periodically
 * Call this from a cron job or similar
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }

  return cleaned
}
