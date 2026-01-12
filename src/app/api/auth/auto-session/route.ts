import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  checkRateLimit,
  clearRateLimit,
  getClientIP,
  validateEmail,
  validateBookingId,
  addTimingDelay,
  GENERIC_AUTH_ERROR,
  timingSafeStringCompare,
} from '@/utilities/securityUtils'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(req.headers)

  try {
    // Rate limiting by IP address
    const rateLimit = checkRateLimit(`auto-session:${clientIP}`, 10, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for auto-session from IP: ${clientIP}`)
      await addTimingDelay()
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 },
      )
    }

    const { sessionToken, bookingId: rawBookingId, email: rawEmail } = await req.json()

    // Validate input format
    if (!sessionToken || !rawBookingId || !rawEmail) {
      await addTimingDelay()
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 })
    }

    // Validate session token format
    if (typeof sessionToken !== 'string' || sessionToken.length !== 64) {
      await addTimingDelay()
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 })
    }

    // Validate and sanitize inputs
    const email = validateEmail(rawEmail)
    const bookingId = validateBookingId(rawBookingId)

    if (!email || !bookingId) {
      await addTimingDelay()
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 400 })
    }

    // Initialize payload instance
    const payload = await getPayload({ config })

    // Find and validate the one-time session token
    let sessions
    try {
      sessions = await payload.find({
        collection: 'auto_login_sessions',
        where: {
          and: [
            { used: { equals: false } },
            { expiresAt: { greater_than: new Date() } },
            { booking: { equals: bookingId } },
          ],
        },
        limit: 10, // Limit to prevent large result sets
      })
    } catch (_error) {
      console.warn(`Database error during session lookup from IP: ${clientIP}`)
      await addTimingDelay()
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 500 })
    }

    // Use timing-safe comparison for session token
    const matchedSession = sessions.docs.find((s) =>
      timingSafeStringCompare(s.sessionToken, sessionToken),
    )

    if (!matchedSession) {
      await addTimingDelay()
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 })
    }

    // Validate all conditions with consistent error handling
    let isValid = false
    let user = null
    let booking = null

    try {
      // Get the user from the session
      const userId =
        typeof matchedSession.user === 'object' ? matchedSession.user?.id : matchedSession.user

      if (!userId) {
        throw new Error('Invalid user reference in session')
      }

      // Fetch user and booking in parallel
      const collection = matchedSession.bookingType === 'event' ? 'event_bookings' : 'tour_bookings'

      const [userResult, bookingResult] = await Promise.all([
        payload.findByID({ collection: 'users', id: userId }).catch(() => null),
        payload.findByID({ collection, id: matchedSession.booking }).catch(() => null),
      ])

      user = userResult
      booking = bookingResult

      // Validate all conditions
      if (
        user &&
        booking &&
        user.email === email &&
        (typeof booking.user === 'object' ? booking.user?.id : booking.user) === userId
      ) {
        isValid = true
      }
    } catch (_error) {
      console.warn(`Validation error during auto-session from IP: ${clientIP}`)
      isValid = false
    }

    // Use consistent error response for all failure cases
    if (!isValid || !user) {
      await addTimingDelay()
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 })
    }

    // Clear rate limit on successful validation
    clearRateLimit(`auto-session:${clientIP}`)

    // Log success without sensitive data
    console.log(`✅ Auto-session validated for user ID: ${user.id} from IP: ${clientIP}`)

    // Ensure consistent timing
    const elapsed = Date.now() - startTime
    if (elapsed < 200) {
      await new Promise((resolve) => setTimeout(resolve, 200 - elapsed))
    }

    // Return success with session token for NextAuth
    return NextResponse.json({
      success: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
      },
    })
  } catch (_error) {
    console.error(`Auto-session system error from IP: ${clientIP}`)
    await addTimingDelay()
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 500 })
  }
}
