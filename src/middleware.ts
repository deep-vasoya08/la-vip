import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is protected (requires authentication)
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/my-account')

  // Check if the path is admin-only
  const isAdminPath = pathname.startsWith('/admin')

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.PAYLOAD_SECRET,
  })

  // If it's a protected path and the user is not logged in, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // If it's an admin path and the user is not an admin, redirect to unauthorized
  if (isAdminPath && token?.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Apply no-cache headers and security headers to all responses
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  // // Security Headers
  // // Prevent clickjacking attacks
  // response.headers.set('X-Frame-Options', 'DENY')

  // // Prevent MIME type sniffing
  // response.headers.set('X-Content-Type-Options', 'nosniff')

  // // Force HTTPS
  // response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // // Content Security Policy
  // response.headers.set(
  //   'Content-Security-Policy',
  //   [
  //     "default-src 'self'",
  //     "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://googleads.g.doubleclick.net https://cdn.termly.io https://app.termly.io https://*.ladesk.com https://js.stripe.com https://www.tripadvisor.com https://*.tripadvisor.com https://static.tacdn.com https://www.shopperapproved.com",
  //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.shopperapproved.com",
  //     "font-src 'self' https://fonts.gstatic.com data:",
  //     "img-src 'self' data: https: blob:",
  //     "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.google.com https://*.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net https://api.stripe.com https://cdn.termly.io https://app.termly.io https://*.ladesk.com https://laviptours.com https://test.laviptours.com https://*.amazonaws.com https://*.cloudfront.net",
  //     "frame-src 'self' https://js.stripe.com https://www.google.com https://www.googletagmanager.com https://*.ladesk.com https://td.doubleclick.net",
  //     "object-src 'none'",
  //     "base-uri 'self'",
  //     "form-action 'self'",
  //     "frame-ancestors 'none'",
  //     'upgrade-insecure-requests',
  //   ].join('; '),
  // )

  // // Additional security headers
  // response.headers.set('X-XSS-Protection', '1; mode=block')
  // response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
