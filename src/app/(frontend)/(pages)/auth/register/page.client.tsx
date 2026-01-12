'use client'

import type React from 'react'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Main page component with Suspense boundary
export default function RegisterClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  // Check if user is coming from a booking flow
  const isFromBooking =
    callbackUrl.includes('restoreBooking') ||
    callbackUrl.includes('restoreTourBooking') ||
    callbackUrl.includes('events/') ||
    callbackUrl.includes('tours/')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    receiveTexts: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // Phone number validation for US phone numbers
  const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; message: string } => {
    // Remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // Check if it's empty
    if (!cleanPhone) {
      return { isValid: false, message: 'Phone number is required' }
    }

    // Check if it has the right length
    if (cleanPhone.length !== 10) {
      return { isValid: false, message: 'Phone number must be 10 digits' }
    }

    return { isValid: true, message: '' }
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleanPhone = value.replace(/\D/g, '')

    // Apply formatting based on length
    if (cleanPhone.length <= 3) {
      return cleanPhone
    } else if (cleanPhone.length <= 6) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3)}`
    } else {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6, 10)}`
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'phoneNumber') {
      // Format the phone number as user types
      const formattedPhone = formatPhoneNumber(value)
      setFormData((prev) => ({
        ...prev,
        [name]: formattedPhone,
      }))

      // Clear phone error when user starts typing
      if (phoneError) {
        setPhoneError('')
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      receiveTexts: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setPhoneError('')

    // Validate phone number before submission
    const phoneValidation = validatePhoneNumber(formData.phoneNumber)
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message)
      setIsLoading(false)
      return
    }

    try {
      // Create name from first and last name
      const name = `${formData.firstName} ${formData.lastName}`.trim()

      // Register the user with Payload
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber.replace(/\D/g, ''), // Send clean phone number to backend
          receiveTexts: formData.receiveTexts,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register')
      }

      // If registration was successful, sign in the user automatically
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      })

      if (signInResult?.error) {
        throw new Error('Registration successful but login failed. Please login manually.')
      }

      // Redirect to callback URL or profile page after successful registration and login
      if (signInResult?.url) {
        setTimeout(() => {
          router.push(signInResult.url || callbackUrl)
        }, 100)
      } else {
        setTimeout(() => {
          router.push(callbackUrl !== '/' ? callbackUrl : '/my-account')
        }, 100)
      }
    } catch (err: unknown) {
      console.error('Registration error:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center rounded-sm shadow-lg p-4 bg-white">
      <div className="w-full max-w-md p-8">
        <h5 className="text-center font-bold text-mustard font-semplicita mb-4">ACCOUNT DETAILS</h5>

        {/* Show booking context message */}
        {isFromBooking && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
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
                  Create an account to continue with your booking. Your booking details will be
                  restored after registration.
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

        <p className="text-md text-black mb-3 font-roboto">Your Profile:</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Input
              type="text"
              name="firstName"
              className="!bg-white !text-black font-roboto"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Input
              type="text"
              name="lastName"
              className="!bg-white !text-black font-roboto"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="!bg-white !text-black font-roboto"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
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

          <div>
            <Input
              type="email"
              name="email"
              className="!bg-white !text-black font-roboto"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Input
              type="tel"
              name="phoneNumber"
              className={`!bg-white !text-black font-roboto ${phoneError ? '!border-red-500' : ''}`}
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isLoading}
              maxLength={14} // (XXX) XXX-XXXX format
              required
            />
            {phoneError && <p className="text-red-500 text-sm mt-1 font-roboto">{phoneError}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="receiveTexts"
              className="!border-black !rounded-xs"
              checked={formData.receiveTexts}
              onCheckedChange={handleCheckboxChange}
              disabled={isLoading}
            />
            <Label htmlFor="receiveTexts" className="text-sm font-roboto text-black">
              I&apos;d like to receive text messages about my Quote.
            </Label>
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
          <div className="w-full flex justify-center">
            <Button
              type="submit"
              variant="mustard"
              className="uppercase items-center"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Continue'}
            </Button>
          </div>
        </form>

        <div className="mt-6 w-full text-center">
          <p className="text-sm font-roboto text-black mb-2">Already have an account?</p>
          <Link
            href={`/auth/login${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
            className="flex justify-center w-full mt-2 items-center"
          >
            <Button variant="mustard" disabled={isLoading}>
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
