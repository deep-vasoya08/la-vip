'use client'

import React, { useState } from 'react'
import Link from 'next/link'
// import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordClient() {
  // const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred')
      }

      setSuccess(true)
    } catch (err: unknown) {
      console.error('Password reset request error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center rounded-sm shadow-lg p-4 bg-white">
      <div className="w-full max-w-md p-8">
        <h5 className="text-center font-bold text-mustard font-semplicita">FORGOT PASSWORD</h5>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3 text-sm font-roboto">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4 text-sm font-roboto">
            <p className="font-semibold mb-2">Password Reset Email Sent!</p>
            <p>
              If an account exists with the email you entered, you will receive a password reset
              link shortly.
            </p>
            <div className="mt-4">
              <Link href="/auth/login">
                <Button variant="mustard" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-md text-black mb-4 font-roboto text-center">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
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

              <div className="w-full flex justify-center items-center">
                <Button
                  type="submit"
                  variant="mustard"
                  className="w-[200px] uppercase"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
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
            <Button variant="mustard">Back to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
