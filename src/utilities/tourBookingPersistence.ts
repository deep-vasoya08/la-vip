'use client'

import { TourBookingFormData } from '@/components/TourBookingPayment/types'

// Key prefix for localStorage
const TOUR_BOOKING_DATA_PREFIX = 'tourBooking_'
const TOUR_BOOKING_EXPIRY_HOURS = 24 // Data expires after 24 hours

interface StoredTourBookingData {
  data: TourBookingFormData
  timestamp: number
  tourId: string
}

/**
 * Generate a unique key for storing tour booking data
 */
export const generateTourBookingKey = (tourId: string): string => {
  return `${TOUR_BOOKING_DATA_PREFIX}${tourId}_${Date.now()}`
}

/**
 * Save tour booking form data to localStorage
 */
export const saveTourBookingData = (tourId: string, data: TourBookingFormData): string => {
  if (typeof window === 'undefined') return ''

  try {
    const key = generateTourBookingKey(tourId)
    const storageData: StoredTourBookingData = {
      data,
      timestamp: Date.now(),
      tourId,
    }

    localStorage.setItem(key, JSON.stringify(storageData))
    return key
  } catch (error) {
    console.error('Failed to save tour booking data:', error)
    return ''
  }
}

/**
 * Retrieve tour booking form data from localStorage
 */
export const getTourBookingData = (key: string): TourBookingFormData | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const storageData: StoredTourBookingData = JSON.parse(stored)

    // Check if data has expired
    const hoursElapsed = (Date.now() - storageData.timestamp) / (1000 * 60 * 60)
    if (hoursElapsed > TOUR_BOOKING_EXPIRY_HOURS) {
      localStorage.removeItem(key)
      return null
    }

    return storageData.data
  } catch (error) {
    console.error('Failed to retrieve tour booking data:', error)
    return null
  }
}

/**
 * Remove tour booking data from localStorage
 */
export const removeTourBookingData = (key: string): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove tour booking data:', error)
  }
}

/**
 * Clean up all tour booking data from localStorage after successful payment
 */
export const cleanupTourBookingDataAfterPayment = (): void => {
  if (typeof window === 'undefined') return

  try {
    const keys = Object.keys(localStorage)
    const bookingKeys = keys.filter((key) => key.startsWith(TOUR_BOOKING_DATA_PREFIX))

    bookingKeys.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Failed to remove tour booking data key:', key, error)
      }
    })

    if (bookingKeys.length > 0) {
      console.log(
        `Cleaned up ${bookingKeys.length} tour booking data entries after successful payment`,
      )
    }
  } catch (error) {
    console.error('Failed to cleanup tour booking data after payment:', error)
  }
}

/**
 * Create callback URL for login with tour booking data restoration
 */
export const createTourBookingCallbackUrl = (currentUrl: string, bookingKey: string): string => {
  try {
    const url = new URL(currentUrl)
    url.searchParams.set('restoreTourBooking', bookingKey)
    return url.toString()
  } catch (error) {
    console.error('Failed to create tour booking callback URL:', error)
    return currentUrl
  }
}

/**
 * Extract tour booking restoration key from URL
 */
export const getTourBookingKeyFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    const urlParams = new URLSearchParams(window.location.search)
    const bookingKey = urlParams.get('restoreTourBooking')

    // Clean up URL after extracting the key
    if (bookingKey) {
      const url = new URL(window.location.href)
      url.searchParams.delete('restoreTourBooking')
      window.history.replaceState({}, '', url.toString())
    }

    return bookingKey
  } catch (error) {
    console.error('Failed to extract tour booking key from URL:', error)
    return null
  }
}
