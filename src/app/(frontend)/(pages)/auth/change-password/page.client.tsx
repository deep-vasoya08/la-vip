'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ChangePasswordClient() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred')
      }

      setSuccess(true)
      // Clear form fields after successful update
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      console.error('Password change error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while changing your password. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  // If the authentication status is loading, show a loading message
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center rounded-sm shadow-lg p-4 bg-white">
        <div className="w-full max-w-md p-8 text-center">
          <h5 className="text-center font-bold text-mustard font-semplicita mb-4">LOADING</h5>
          <p className="text-md text-black">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center rounded-sm shadow-lg p-4 bg-white">
      <div className="w-full max-w-md p-8">
        <h5 className="text-center font-bold text-mustard font-semplicita">CHANGE PASSWORD</h5>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3 text-sm font-roboto">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4 text-sm font-roboto">
            <p className="font-semibold mb-2">Password Changed Successfully!</p>
            <p>Your password has been updated. You can now use your new password to log in.</p>
            <div className="mt-4">
              <Link href="/">
                <Button variant="mustard" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-md text-black mb-4 font-roboto text-center">
              Please enter your current password and your new password below.
            </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="!bg-white !text-black font-roboto"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="default"
                  size="clear"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isLoading}
                >
                  <Image
                    src={showCurrentPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                    alt={showCurrentPassword ? 'Hide Password' : 'Show Password'}
                    width={20}
                    height={20}
                  />
                </Button>
              </div>

              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  className="!bg-white !text-black font-roboto"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="default"
                  size="clear"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  <Image
                    src={showNewPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                    alt={showNewPassword ? 'Hide Password' : 'Show Password'}
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
                  {isLoading ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 w-full flex justify-center flex-col">
          <h5 className="text-center font-semplicita text-mustard mb-3 font-semibold">
            BACK TO ACCOUNT
          </h5>
          <Link href="/my-account" className="flex justify-center w-full mt-2 items-center">
            <Button variant="mustard" disabled={isLoading}>
              Return to Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
