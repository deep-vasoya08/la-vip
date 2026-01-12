import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'
import { validateAutoLoginToken, generateSessionToken } from '@/utilities/encryption'
import {
  checkRateLimit,
  clearRateLimit,
  getClientIP,
  validateUserId,
  validateBookingId,
  addTimingDelay,
} from '@/utilities/securityUtils'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(req.headers)

  try {
    // Rate limiting by IP address
    const rateLimit = checkRateLimit(`auto-login:${clientIP}`, 10, 15 * 60 * 1000) // 10 attempts per 15 min
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`)
      await addTimingDelay()
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
      return NextResponse.redirect(new URL('/auth/login?error=too-many-attempts', baseUrl))
    }

    const { searchParams } = new URL(req.url)
    const encryptedToken = searchParams.get('token')

    if (!encryptedToken) {
      await addTimingDelay()
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
      return NextResponse.redirect(new URL('/auth/login?error=invalid-link', baseUrl))
    }

    // Decrypt and validate the token
    let tokenData
    try {
      tokenData = validateAutoLoginToken(decodeURIComponent(encryptedToken))
    } catch (error) {
      // Don't log the actual error details to prevent information leakage
      console.warn(`Auto-login token validation failed from IP: ${clientIP}`)
      await addTimingDelay()
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
      return NextResponse.redirect(new URL('/auth/login?error=invalid-link', baseUrl))
    }

    const { userId: rawUserId, email: userEmail, bookingId: rawBookingId, type } = tokenData

    // Validate and sanitize IDs to prevent type coercion vulnerabilities
    const userId = validateUserId(rawUserId)
    const bookingId = validateBookingId(rawBookingId)

    if (!userId || !bookingId) {
      console.warn(`Invalid user or booking ID in token from IP: ${clientIP}`)
      await addTimingDelay()
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
      return NextResponse.redirect(new URL('/auth/login?error=invalid-link', baseUrl))
    }

    // Initialize payload instance
    const payload = await getPayload({ config })

    // Determine collection based on booking type
    const collection = type === 'event' ? 'event_bookings' : 'tour_bookings'

    // Validate booking exists and belongs to user (with consistent error handling)
    let booking
    let user
    let isValid = false

    try {
      // Fetch both in parallel for better performance
      const [bookingResult, userResult] = await Promise.all([
        payload
          .findByID({
            collection,
            id: bookingId,
            depth: 2,
          })
          .catch(() => null),
        payload
          .findByID({
            collection: 'users',
            id: userId,
          })
          .catch(() => null),
      ])

      booking = bookingResult
      user = userResult

      // Validate all conditions
      if (user && booking && user.email === userEmail && validateUserId(booking.user) === userId) {
        isValid = true
      }
    } catch (error) {
      console.warn(`Database error during auto-login validation from IP: ${clientIP}`)
      isValid = false
    }

    // Use consistent error message and timing for all failure cases
    if (!isValid || !user || !booking) {
      await addTimingDelay()
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
      return NextResponse.redirect(new URL('/auth/login?error=invalid-link', baseUrl))
    }

    // Check if user is already signed in
    const session = await getServerSession(authOptions)
    if (session?.user?.id === String(user.id)) {
      // User is already signed in, clear rate limit and redirect directly to booking
      clearRateLimit(`auto-login:${clientIP}`)
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
      const bookingPath = type === 'event' ? `events/${bookingId}` : `tours/${bookingId}`
      return NextResponse.redirect(new URL(`/my-account/${bookingPath}`, baseUrl))
    }

    // Create a one-time use session token in the database
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 60 minutes

    await payload.create({
      collection: 'auto_login_sessions',
      data: {
        sessionToken,
        user: userId,
        booking: bookingId,
        bookingType: type,
        used: false,
        expiresAt: expiresAt.toISOString(),
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    // Clear rate limit on successful session creation
    clearRateLimit(`auto-login:${clientIP}`)

    // Log success without sensitive data
    console.log(`✅ Auto-login session created for user ID: ${userId} from IP: ${clientIP}`)

    // Ensure consistent timing regardless of success
    const elapsed = Date.now() - startTime
    if (elapsed < 200) {
      await new Promise((resolve) => setTimeout(resolve, 200 - elapsed))
    }

    // Pass the session token to the auto-login page
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
    return NextResponse.redirect(
      new URL(
        `/auto-login?sessionToken=${sessionToken}&bookingId=${bookingId}&type=${type}&email=${encodeURIComponent(userEmail)}`,
        baseUrl,
      ),
    )
  } catch (error) {
    // Generic error - don't leak information about what went wrong
    console.error(`Auto-login system error from IP: ${clientIP}`)
    await addTimingDelay()
    const baseUrl = new URL(req.url).origin
    return NextResponse.redirect(new URL('/auth/login?error=invalid-link', baseUrl))
  }
}
