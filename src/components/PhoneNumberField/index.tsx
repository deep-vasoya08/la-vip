'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'

interface PhoneNumberFieldProps {
  onPhoneNumberChange?: (phoneNumber: string) => void
  className?: string
  disabled?: boolean
  // Formik integration props
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  name?: string
  // Required mode - shows field always, not conditionally
  required?: boolean
}

const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  onPhoneNumberChange,
  className = '',
  disabled = false,
  value: propValue,
  onChange: propOnChange,
  onBlur: propOnBlur,
  error: propError,
  name,
  required = false,
}) => {
  const { data: session } = useSession()
  const [phoneNumber, setPhoneNumber] = useState(propValue || '')
  const [phoneError, setPhoneError] = useState('')
  const [userHasPhone, setUserHasPhone] = useState(false)
  const [isLoading, setIsLoading] = useState(!required) // Skip loading if required mode

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

  // Check if user has phone number when component mounts (only in conditional mode)
  useEffect(() => {
    if (required) {
      // In required mode, always show the field
      setIsLoading(false)
      return
    }

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
  }, [session?.user?.id, required])

  // Save phone number to user profile
  const savePhoneNumber = async (phoneNumber: string) => {
    if (!session?.user?.id) return

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
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save phone number:', response.status, errorData)
        return false
      }
    } catch (error) {
      console.error('Error saving phone number:', error)
      return false
    }
  }

  // Handle phone number change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedPhone = formatPhoneNumber(value)

    // Update local state
    setPhoneNumber(formattedPhone)

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('')
    }

    // If using formik (required mode), call the formik onChange
    if (propOnChange) {
      // Create a new event with the clean phone number for formik
      const cleanPhone = formattedPhone.replace(/\D/g, '')
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanPhone,
          name: name || 'phoneNumber',
        },
      }
      propOnChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
    }

    // Validate and notify parent (for backward compatibility)
    const validation = validatePhoneNumber(formattedPhone)
    if (validation.isValid) {
      // Send clean phone number to parent
      const cleanPhone = formattedPhone.replace(/\D/g, '')
      onPhoneNumberChange?.(cleanPhone)
    } else {
      onPhoneNumberChange?.('')
    }
  }

  // Handle blur for validation
  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    // Call formik onBlur if provided
    if (propOnBlur) {
      propOnBlur(e)
    }

    if (phoneNumber) {
      const validation = validatePhoneNumber(phoneNumber)
      if (!validation.isValid) {
        setPhoneError(validation.message)
      } else {
        // Save valid phone number to user profile (only in conditional mode)
        if (!required && session?.user?.id) {
          const cleanPhone = phoneNumber.replace(/\D/g, '')
          await savePhoneNumber(cleanPhone)
        }
      }
    }
  }

  // Don't render anything if loading or user already has phone number (only in conditional mode)
  if (!required && (isLoading || userHasPhone || !session?.user)) {
    return null
  }

  // In required mode, always show the field
  const shouldShow = required || (!isLoading && !userHasPhone && session?.user)
  if (!shouldShow) {
    return null
  }

  // Use formik error if provided, otherwise use local error
  const displayError = propError || phoneError
  const displayValue = propValue !== undefined ? formatPhoneNumber(propValue || '') : phoneNumber

  return (
    <div className={`form-group ${className}`}>
      {!required && (
        <div className="mb-3">
          <p className="text-sm text-black mb-2">
            We need your phone number to send you booking updates and important notifications.
          </p>
        </div>
      )}
      <Input
        type="tel"
        placeholder={required ? 'Phone Number *' : 'Phone Number'}
        value={displayValue}
        onChange={handlePhoneChange}
        onBlur={handleBlur}
        disabled={disabled}
        name={name || 'phoneNumber'}
        className={`!bg-white !text-gray font-semibold w-full p-3 border border-gray rounded placeholder:text-gray ${
          displayError ? 'border-red-500' : 'border-gray-300'
        }`}
        maxLength={14} // (XXX) XXX-XXXX format
      />
      {displayError && <p className="text-red-500 text-sm mt-1 font-semibold">{displayError}</p>}
    </div>
  )
}

export default PhoneNumberField
