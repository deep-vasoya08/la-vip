'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { refreshSession } from '@/lib/session-refresh'

interface RequiredPhoneNumberProps {
  className?: string
  onPhoneNumberSaved?: () => void
  // Ref to expose validation methods to parent
  ref?: React.Ref<RequiredPhoneNumberHandle>
}

// Interface for methods exposed to parent component
export interface RequiredPhoneNumberHandle {
  validateAndSave: () => Promise<boolean>
  isRequired: () => boolean
}

const RequiredPhoneNumber = forwardRef<RequiredPhoneNumberHandle, RequiredPhoneNumberProps>(
  ({ className = '', onPhoneNumberSaved }, ref) => {
    const { data: session } = useSession()
    const [phoneNumber, setPhoneNumber] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [userHasPhone, setUserHasPhone] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Phone number validation for US phone numbers
    const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; message: string } => {
      // Clean the phone number (remove all non-digits)
      const cleanPhone = phoneNumber.replace(/\D/g, '')

      // Check if empty
      if (!cleanPhone) {
        return { isValid: false, message: 'Phone number is required' }
      }

      // Check if 10 digits
      if (cleanPhone.length !== 10) {
        return { isValid: false, message: 'Phone number must be 10 digits' }
      }

      return { isValid: true, message: '' }
    }

    // Format phone number as user types
    const formatPhoneNumber = (value: string): string => {
      // Remove all non-digits
      const cleanPhone = value.replace(/\D/g, '')

      // Apply formatting
      if (cleanPhone.length <= 3) {
        return cleanPhone
      } else if (cleanPhone.length <= 6) {
        return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3)}`
      } else {
        return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6, 10)}`
      }
    }

    // Check if user has phone number when component mounts
    useEffect(() => {
      const checkUserPhoneNumber = async () => {
        if (!session?.user?.id) {
          setIsLoading(false)
          return
        }

        try {
          const response = await fetch('/api/users/profile')
          if (response.ok) {
            const userData = await response.json()
            // Check if phone number exists and is not empty
            if (userData.user?.phoneNumber && userData.user.phoneNumber.trim() !== '') {
              setUserHasPhone(true)
            }
          } else {
            console.error('Failed to fetch user profile:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Error checking user phone number:', error)
        } finally {
          setIsLoading(false)
        }
      }

      checkUserPhoneNumber()
    }, [session?.user?.id])

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      validateAndSave: async (): Promise<boolean> => {
        // If user already has phone or not logged in, return true
        if (userHasPhone || !session?.user?.id) {
          return true
        }

        // Validate current phone number
        const validation = validatePhoneNumber(phoneNumber)
        if (!validation.isValid) {
          setPhoneError(validation.message)
          return false
        }

        // Save phone number
        const cleanPhone = phoneNumber.replace(/\D/g, '')
        const success = await savePhoneNumber(cleanPhone)
        return success
      },
      isRequired: (): boolean => {
        return !isLoading && !userHasPhone && !!session?.user?.id
      },
    }))

    // Save phone number to user profile
    const savePhoneNumber = async (phoneNumber: string) => {
      if (!session?.user?.id) return false

      setIsSaving(true)
      try {
        const response = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
          }),
        })

        if (response.ok) {
          console.log('Phone number saved successfully')
          // Update state so component disappears after successful save
          setUserHasPhone(true)
          onPhoneNumberSaved?.()

          // Refresh the session to include the new phone number
          refreshSession()

          return true
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to save phone number:', response.status, errorData)
          return false
        }
      } catch (error) {
        console.error('Error saving phone number:', error)
        return false
      } finally {
        setIsSaving(false)
      }
    }

    // Handle phone number change
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const formattedPhone = formatPhoneNumber(value)
      setPhoneNumber(formattedPhone)

      // Clear error when user starts typing
      if (phoneError) {
        setPhoneError('')
      }
    }

    // Handle save button click
    const handleSave = async () => {
      const validation = validatePhoneNumber(phoneNumber)
      if (!validation.isValid) {
        setPhoneError(validation.message)
        return
      }

      // Save valid phone number to user profile
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      await savePhoneNumber(cleanPhone)
    }

    // Don't render anything if loading or user already has phone number
    if (isLoading || userHasPhone || !session?.user) {
      return null
    }

    return (
      <div className={`${className}`}>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-black mb-4">
              We need your phone number to send you booking updates and important notifications.
              You&apos;ll only need to provide this once.
            </p>
          </div>

          <div className="space-y-3">
            <Input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isSaving}
              className={`!bg-white !text-gray font-semibold w-full p-3 border rounded placeholder:text-gray ${
                phoneError ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={14} // (XXX) XXX-XXXX format
            />
            {phoneError && <p className="text-red-500 text-sm font-semibold">{phoneError}</p>}
          </div>

          <div className="flex justify-end">
            {/* <Button
              onClick={handleSave}
              disabled={isSaving || !phoneNumber}
              variant="mustard"
              className="min-w-[120px]"
            >
              {isSaving ? 'Saving...' : 'Save Phone Number'}
            </Button> */}
          </div>
        </div>
      </div>
    )
  },
)

RequiredPhoneNumber.displayName = 'RequiredPhoneNumber'

export default RequiredPhoneNumber
