'use client'

import { BookingFormData } from '@/components/EventBookingPayment/EventBookingForm'

// Key prefix for localStorage
const BOOKING_DATA_PREFIX = 'eventBooking_'
const BOOKING_EXPIRY_HOURS = 24 // Data expires after 24 hours

interface StoredBookingData {
  data: BookingFormData
  timestamp: number
  eventId: string
}

/**
 * Generate a unique key for storing booking data
 */
export const generateBookingKey = (eventId: string): string => {
  return `${BOOKING_DATA_PREFIX}${eventId}_${Date.now()}`
}

/**
 * Save booking form data to localStorage
 */
export const saveBookingData = (eventId: string, data: BookingFormData): string => {
  if (typeof window === 'undefined') return ''

  try {
    const key = generateBookingKey(eventId)
    const storageData: StoredBookingData = {
      data,
      timestamp: Date.now(),
      eventId,
    }

    localStorage.setItem(key, JSON.stringify(storageData))
    return key
  } catch (error) {
    console.error('Failed to save booking data:', error)
    return ''
  }
}

/**
 * Retrieve booking form data from localStorage
 */
export const getBookingData = (key: string): BookingFormData | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const storageData: StoredBookingData = JSON.parse(stored)

    // Check if data has expired
    const hoursElapsed = (Date.now() - storageData.timestamp) / (1000 * 60 * 60)
    if (hoursElapsed > BOOKING_EXPIRY_HOURS) {
      localStorage.removeItem(key)
      return null
    }

    return storageData.data
  } catch (error) {
    console.error('Failed to retrieve booking data:', error)
    return null
  }
}

/**
 * Remove booking data from localStorage
 */
export const removeBookingData = (key: string): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove booking data:', error)
  }
}

/**
 * Clean up all booking data from localStorage after successful payment
 */
export const cleanupBookingDataAfterPayment = (): void => {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    const bookingKeys = keys.filter((key) => key.startsWith(BOOKING_DATA_PREFIX))

    bookingKeys.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Failed to remove booking data key:', key, error)
      }
    })

    if (bookingKeys.length > 0) {
      console.log(`Cleaned up ${bookingKeys.length} booking data entries after successful payment`)
    }
  } catch (error) {
    console.error('Failed to cleanup booking data after payment:', error)
  }
}

/**
 * Create callback URL for login with booking data restoration
 */
export const createBookingCallbackUrl = (currentUrl: string, bookingKey: string): string => {
  try {
    const url = new URL(currentUrl)
    url.searchParams.set('restoreBooking', bookingKey)
    return url.toString()
  } catch (error) {
    console.error('Failed to create callback URL:', error)
    return currentUrl
  }
}

/**
 * Extract booking restoration key from URL
 */
export const getBookingKeyFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    const urlParams = new URLSearchParams(window.location.search)
    const bookingKey = urlParams.get('restoreBooking')

    // Clean up URL after extracting the key
    if (bookingKey) {
      const url = new URL(window.location.href)
      url.searchParams.delete('restoreBooking')
      window.history.replaceState({}, '', url.toString())
    }

    return bookingKey
  } catch (error) {
    console.error('Failed to extract booking key from URL:', error)
    return null
  }
}
