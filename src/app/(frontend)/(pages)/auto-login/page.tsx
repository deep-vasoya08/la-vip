'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertCircle, CheckCircle } from 'lucide-react'

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

function AutoLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Signing you in automatically...')

  const sessionToken = searchParams.get('sessionToken')
  const bookingId = searchParams.get('bookingId')
  const bookingType = searchParams.get('type') || 'event'
  const email = searchParams.get('email')

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        if (!sessionToken || !bookingId || !email) {
          throw new Error('Invalid auto-login link - missing parameters')
        }

        // Validate session token format
        if (sessionToken.length !== 64) {
          throw new Error('Invalid session token format')
        }

        setMessage('Validating your access...')

        // Validate the session token with the server
        const response = await fetch('/api/auth/auto-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionToken: sessionToken,
            bookingId: bookingId,
            email: decodeURIComponent(email),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to validate session')
        }

        const sessionData = await response.json()

        if (!sessionData.success || !sessionData.sessionToken) {
          throw new Error('Invalid session response')
        }

        setMessage('Verifying your credentials...')

        // Sign in using NextAuth with the secure session token
        const result = await signIn('credentials', {
          email: sessionData.user.email,
          password: `auto-login-session:${sessionData.sessionToken}`, // Secure session token
          redirect: false,
        })

        if (result?.error) {
          console.error('NextAuth sign-in failed:', result.error)
          throw new Error('Authentication failed. Please try again.')
        }

        if (!result?.ok) {
          throw new Error('Authentication failed. Please try again.')
        }

        setStatus('success')
        setMessage('Successfully signed in! Redirecting to your booking...')

        // Wait a moment then redirect
        setTimeout(() => {
          const bookingPath = bookingType === 'event' ? `events/${bookingId}` : `tours/${bookingId}`
          router.push(`/my-account/${bookingPath}`)
        }, 1500)
      } catch (error) {
        console.error('Auto-login failed:', error)
        setStatus('error')
        setMessage(
          error instanceof Error ? error.message : 'Auto-login failed. Please sign in manually.',
        )

        // Redirect to login after showing error
        setTimeout(() => {
          const bookingPath = bookingType === 'event' ? `events/${bookingId}` : `tours/${bookingId}`
          router.push(`/auth/login?callbackUrl=/my-account/${bookingPath}`)
        }, 3000)
      }
    }

    performAutoLogin()
  }, [sessionToken, bookingId, bookingType, email, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-black mb-2">Accessing Your Booking</h1>
              <p className="text-black">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-black mb-2">Welcome Back!</h1>
              <p className="text-black">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-black mb-2">Sign In Required</h1>
              <p className="text-black">{message}</p>
              <p className="text-sm text-black mt-2">Redirecting to login page...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AutoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-8 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <LoadingSpinner
                size="lg"
                className="mx-auto mb-4"
                message="Preparing your auto-login..."
              />
            </div>
          </div>
        </div>
      }
    >
      <AutoLoginContent />
    </Suspense>
  )
}
