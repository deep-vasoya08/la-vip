'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Main page component with Suspense boundary
export default function LoginClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const { data: session } = useSession()

  // Check if user is coming from a booking flow
  const isFromBooking =
    callbackUrl.includes('restoreBooking') ||
    callbackUrl.includes('restoreTourBooking') ||
    callbackUrl.includes('events/') ||
    callbackUrl.includes('tours/')

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      // Small delay to ensure session is fully established
      setTimeout(() => {
        router.push(callbackUrl)
      }, 100)
    }
  }, [session, router, callbackUrl])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (result?.url) {
        // Small delay to ensure session is fully established before redirect
        setTimeout(() => {
          router.push(result.url || callbackUrl)
        }, 100)
      } else {
        // Fallback redirect to callback URL
        setTimeout(() => {
          router.push(callbackUrl)
        }, 100)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center rounded-sm shadow-lg p-4 bg-white">
      <div className="w-full max-w-md p-8">
        <h5 className="text-center font-bold text-mustard font-semplicita">YOUR ACCOUNT</h5>

        {/* Show booking context message */}
        {isFromBooking && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 mt-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Please log in to continue with your booking. Your booking details will be restored
                  after login.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3 text-sm font-roboto">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className="text-md text-black mb-3 font-roboto text-center">Continue with:</p>
          <div className="flex gap-3 mb-4 w-full">
            <Button
              variant="default"
              size="clear"
              className="w-full flex items-center justify-center border-2 border-gray/30 rounded-full p-3 hover:shadow-md hover:border-mustard transition-all duration-300"
              onClick={() => {
                setIsLoading(true)
                signIn('google', { callbackUrl })
              }}
              disabled={isLoading}
            >
              <Image src="/images/google-icon.svg" alt="Google" width={28} height={28} />
            </Button>
            {/* <Button
              variant="default"
              size="clear"
              className="flex items-center justify-center w-1/2 border-2 border-gray/30 rounded-full p-3 hover:shadow-md hover:border-mustard transition-all duration-300"
              onClick={() => {
                setIsLoading(true)
                signIn('apple', { callbackUrl })
              }}
              disabled={isLoading}
            >
              <Image src="/images/apple-icon.svg" alt="Apple" width={28} height={28} />
            </Button> */}
          </div>

          <p className="text-md text-black mb-3 font-roboto text-center">Or Login with Email:</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                type="email"
                className="!bg-white !text-black font-roboto"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                className="!bg-white !text-black font-roboto"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="default"
                size="clear"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Image
                  src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                  alt={showPassword ? 'Hide Password' : 'Show Password'}
                  width={20}
                  height={20}
                />
              </Button>
            </div>

            <div className="flex justify-end mt-1 mb-2">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-mustard hover:underline font-roboto"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="w-full flex justify-center items-center">
              <Button
                type="submit"
                variant="mustard"
                className="w-[200px] uppercase"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
            </div>
          </form>
        </div>

        <div className="text-sm text-left font-roboto text-black mt-4">
          By continuing, you agree to LA VIP&apos;s{' '}
          <Link
            href="/terms-and-conditions"
            className="text-mustard hover:underline font-roboto font-semibold"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy-policy"
            className="text-mustard hover:underline font-roboto font-semibold"
          >
            Privacy Policy
          </Link>
          .
        </div>

        <div className="mt-6 w-full flex justify-center flex-col">
          <h5 className="text-center font-semplicita text-mustard mb-3 font-semibold">
            DON&apos;T HAVE AN ACCOUNT?
          </h5>
          <Link
            href={`/auth/register${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
            className="flex justify-center w-full mt-2 items-center"
          >
            <Button variant="mustard" disabled={isLoading}>
              Register Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
