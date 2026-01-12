'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Main page component with Suspense boundary
export default function ResetPasswordClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

// Client component that uses useSearchParams
function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    // Check if token exists and is valid
    if (!token) {
      setTokenValid(false)
      setError('Invalid or missing reset token. Please request a new password reset link.')
      return
    }

    // Optional: Verify token validity with an API call
    // This step can be omitted if you want to verify on form submission only
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`)
        if (!response.ok) {
          setTokenValid(false)
          setError('Your password reset link has expired or is invalid. Please request a new one.')
        }
      } catch (err) {
        console.error('Token verification error:', err)
        setTokenValid(false)
        setError('An error occurred while verifying your reset link. Please try again.')
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred')
      }

      setSuccess(true)
      // Clear form fields after successful reset
      setPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      console.error('Password reset error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while resetting your password. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Show error message if token is invalid
  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center rounded-sm shadow-lg p-4 bg-white">
        <div className="w-full max-w-md p-8">
          <h5 className="text-center font-bold text-mustard font-semplicita">RESET PASSWORD</h5>

          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4 text-sm font-roboto">
            <p className="font-semibold mb-2">Invalid Reset Link</p>
            <p>{error}</p>
          </div>

          <div className="mt-6 w-full flex justify-center">
            <Link href="/auth/forgot-password">
              <Button variant="mustard">Request New Reset Link</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center rounded-sm shadow-lg p-4 bg-white">
      <div className="w-full max-w-md p-8">
        <h5 className="text-center font-bold text-mustard font-semplicita">RESET PASSWORD</h5>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3 text-sm font-roboto">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4 text-sm font-roboto">
            <p className="font-semibold mb-2">Password Reset Successful!</p>
            <p>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <div className="mt-4">
              <Link href="/auth/login">
                <Button variant="mustard" className="w-full">
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-md text-black mb-4 font-roboto text-center">
              Please enter your new password below.
            </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  className="!bg-white !text-black font-roboto"
                  placeholder="New Password"
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

              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="!bg-white !text-black font-roboto"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="default"
                  size="clear"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <Image
                    src={showConfirmPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                    alt={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                    width={20}
                    height={20}
                  />
                </Button>
              </div>

              <div className="w-full flex justify-center items-center">
                <Button
                  type="submit"
                  variant="mustard"
                  className="w-[200px] uppercase"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 w-full flex justify-center flex-col">
          {/* <h5 className="text-center font-semplicita text-mustard mb-3 font-semibold">
            REMEMBERED YOUR PASSWORD?
          </h5> */}
          <Link href="/auth/login" className="flex justify-center w-full mt-2 items-center">
            <Button variant="mustard" disabled={isLoading}>
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
