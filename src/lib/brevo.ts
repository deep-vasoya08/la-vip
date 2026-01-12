/**
 * Brevo (formerly Sendinblue) API integration service
 * Documentation: https://developers.brevo.com/docs/
 */

const BREVO_API_BASE_URL = process.env.BREVO_API_BASE_URL || 'https://api.brevo.com/v3'
const BREVO_API_KEY = process.env.BREVO_API_KEY || ''

/**
 * Format phone number to E.164 format required by Brevo
 * E.164 format: +[country code][number]
 * According to Brevo docs: https://developers.brevo.com/reference/createcontact
 * Accepted formats: 91xxxxxxxxxx, +91xxxxxxxxxx, 0091xxxxxxxxxx
 *
 * @param phoneNumber Phone number (can be 10 digits, with or without formatting)
 * @param defaultCountryCode Default country code (defaults to '1' for US)
 * @returns Formatted phone number in E.164 format or null if invalid
 */
export function formatPhoneToE164(
  phoneNumber: string | undefined | null,
  defaultCountryCode: string = '1',
): string | null {
  if (!phoneNumber) {
    return null
  }

  // Remove all non-digit characters
  const cleanPhone = phoneNumber.replace(/\D/g, '')

  // If empty after cleaning, return null
  if (!cleanPhone) {
    return null
  }

  // If already starts with country code (11+ digits), use as is
  if (cleanPhone.length >= 11) {
    // Check if it already starts with country code
    if (cleanPhone.startsWith(defaultCountryCode)) {
      return `+${cleanPhone}`
    }
    // If it's 11 digits and starts with 1, assume US
    if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      return `+${cleanPhone}`
    }
    // If it starts with 00, it's international format (e.g., 0091xxxxxxxxxx)
    if (cleanPhone.startsWith('00')) {
      // Remove the 00 and add +
      return `+${cleanPhone.substring(2)}`
    }
    // Otherwise, prepend default country code
    return `+${defaultCountryCode}${cleanPhone}`
  }

  // For 10-digit US numbers, validate and prepend country code
  if (cleanPhone.length === 10) {
    // US phone numbers cannot start with 0 or 1
    // Area codes start with 2-9, and the first digit of the local number cannot be 0 or 1
    if (cleanPhone.startsWith('0') || cleanPhone.startsWith('1')) {
      console.warn('[formatPhoneToE164] - Invalid US phone number format (starts with 0 or 1)', {
        original: phoneNumber,
        cleaned: cleanPhone,
      })
      return null // Invalid US phone number
    }

    // Check if area code is valid (first digit should be 2-9)
    const firstDigit = cleanPhone.charAt(0)
    if (firstDigit) {
      const areaCodeFirstDigit = parseInt(firstDigit, 10)
      if (isNaN(areaCodeFirstDigit) || areaCodeFirstDigit < 2 || areaCodeFirstDigit > 9) {
        console.warn('[formatPhoneToE164] - Invalid US area code', {
          original: phoneNumber,
          cleaned: cleanPhone,
        })
        return null
      }
    }

    // Check if exchange code is valid (4th digit should be 2-9)
    const fourthDigit = cleanPhone.charAt(3)
    if (fourthDigit) {
      const exchangeFirstDigit = parseInt(fourthDigit, 10)
      if (isNaN(exchangeFirstDigit) || exchangeFirstDigit < 2 || exchangeFirstDigit > 9) {
        console.warn('[formatPhoneToE164] - Invalid US exchange code', {
          original: phoneNumber,
          cleaned: cleanPhone,
        })
        return null
      }
    }

    return `+${defaultCountryCode}${cleanPhone}`
  }

  // Invalid length
  console.warn('[formatPhoneToE164] - Invalid phone number length', {
    original: phoneNumber,
    cleaned: cleanPhone,
    length: cleanPhone.length,
  })
  return null
}

export interface BrevoContactAttributes {
  FIRSTNAME?: string
  LASTNAME?: string
  SMS?: string
  TAGS?: string
  EVENT_NAME?: string
  EVENT_CATEGORY?: string
  EVENT_DATE?: string
  TOUR_NAME?: string
  TOUR_DATE?: string
  LAST_EVENT_PURCHASED?: string
  LAST_TOUR_PURCHASED?: string
  LAST_BOOKING_DATE?: string
  [key: string]: string | number | boolean | undefined
}

export interface CreateBrevoContactParams {
  email: string
  attributes?: BrevoContactAttributes
  listIds?: number[]
  updateEnabled?: boolean
  tags?: string[] // Optional tags array (legacy support, now using TAGS attribute)
}

export interface BrevoContactResponse {
  id: number
  email: string
}

export interface BrevoErrorResponse {
  code?: string
  message?: string
}

export interface SendSmsParams {
  recipient: string // Phone number in E.164 format
  content: string // SMS message content
  sender?: string // SMS sender name (optional, uses default if not provided)
  type?: 'transactional' | 'marketing' // SMS type, defaults to transactional
}

export interface SendSmsResponse {
  reference?: string
  messageId?: string
}

/**
 * Create or update a contact in Brevo
 * @param params Contact information
 * @returns Promise with success status and contact data or error
 */
export async function createOrUpdateBrevoContact(
  params: CreateBrevoContactParams,
): Promise<{ success: boolean; data?: BrevoContactResponse; error?: string }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY environment variable is not configured' }
  }

  try {
    // Format phone number to E.164 if SMS attribute exists
    const attributes = { ...params.attributes }
    if (attributes.SMS) {
      const formattedPhone = formatPhoneToE164(attributes.SMS)
      if (formattedPhone) {
        attributes.SMS = formattedPhone
      } else {
        // Remove invalid phone number to avoid API error - continue without phone
        delete attributes.SMS
      }
    }

    const requestBody: any = {
      email: params.email,
      attributes,
      listIds: params.listIds || [],
      updateEnabled: params.updateEnabled !== false,
    }

    // Add tags if provided
    if (params.tags && params.tags.length > 0) {
      requestBody.tags = params.tags
    }

    const response = await fetch(`${BREVO_API_BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // Safely parse JSON response - handle empty or invalid responses
    let data: any = {}
    const responseText = await response.text()

    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        // If response is successful but JSON is invalid, treat as success
        if (response.ok) {
          return { success: true, data: { id: 0 } as BrevoContactResponse }
        }
        // If not OK, return error
        return {
          success: false,
          error: `Invalid response from Brevo API: ${response.statusText}`,
        }
      }
    } else {
      // Empty response
      if (response.ok) {
        return { success: true, data: { id: 0 } as BrevoContactResponse }
      }
    }

    if (!response.ok) {
      // Handle existing contact (409) as success since updateEnabled is true
      if (response.status === 400 && data.code === 'duplicate_parameter') {
        // Contact already exists, try to update it
        return await updateBrevoContact(params)
      }

      // Handle invalid phone number error - retry without phone number
      if (
        response.status === 400 &&
        data.code === 'invalid_parameter' &&
        data.message?.includes('phone')
      ) {
        // Remove SMS attribute and retry
        const attributesWithoutPhone = { ...attributes }
        delete attributesWithoutPhone.SMS

        const retryBody: any = {
          email: params.email,
          attributes: attributesWithoutPhone,
          listIds: params.listIds || [],
          updateEnabled: params.updateEnabled !== false,
        }

        // Add tags if provided
        if (params.tags && params.tags.length > 0) {
          retryBody.tags = params.tags
        }

        const retryResponse = await fetch(`${BREVO_API_BASE_URL}/contacts`, {
          method: 'POST',
          headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(retryBody),
        })

        // Safely parse retry JSON response
        let retryData: any = {}
        const retryResponseText = await retryResponse.text()

        if (retryResponseText && retryResponseText.trim()) {
          try {
            retryData = JSON.parse(retryResponseText)
          } catch (parseError) {
            // If retry response is successful but JSON is invalid, treat as success
            if (retryResponse.ok) {
              return { success: true, data: { id: 0 } as BrevoContactResponse }
            }
          }
        } else if (retryResponse.ok) {
          // Empty response but OK status
          return { success: true, data: { id: 0 } as BrevoContactResponse }
        }

        if (retryResponse.ok) {
          return { success: true, data: retryData as BrevoContactResponse }
        } else {
          // If retry also fails, return the original error
          const errorMessage =
            (data as BrevoErrorResponse).message || `Brevo API error: ${response.statusText}`
          return { success: false, error: errorMessage }
        }
      }

      const errorMessage =
        (data as BrevoErrorResponse).message || `Brevo API error: ${response.statusText}`
      return { success: false, error: errorMessage }
    }

    return { success: true, data: data as BrevoContactResponse }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: errorMessage }
  }
}

/**
 * Update an existing contact in Brevo
 * @param params Contact information
 * @returns Promise with success status and contact data or error
 */
async function updateBrevoContact(
  params: CreateBrevoContactParams,
): Promise<{ success: boolean; data?: BrevoContactResponse; error?: string }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY environment variable is not configured' }
  }

  try {
    // Format phone number to E.164 if SMS attribute exists
    const attributes = { ...params.attributes }
    if (attributes.SMS) {
      const formattedPhone = formatPhoneToE164(attributes.SMS)
      if (formattedPhone) {
        attributes.SMS = formattedPhone
      } else {
        // Remove invalid phone number to avoid API error - continue without phone
        delete attributes.SMS
      }
    }

    const requestBody: any = {
      attributes,
      listIds: params.listIds || [],
    }

    // Add tags if provided
    if (params.tags && params.tags.length > 0) {
      requestBody.tags = params.tags
    }

    const url = `${BREVO_API_BASE_URL}/contacts/${encodeURIComponent(params.email)}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // Safely parse JSON response - handle empty or invalid responses
    let data: any = {}
    const responseText = await response.text()

    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        // If response is successful but JSON is invalid, treat as success
        if (response.ok) {
          return { success: true, data: { id: 0 } as BrevoContactResponse }
        }
        // If not OK, return error
        return {
          success: false,
          error: `Invalid response from Brevo API: ${response.statusText}`,
        }
      }
    } else {
      // Empty response
      if (response.ok) {
        return { success: true, data: { id: 0 } as BrevoContactResponse }
      }
    }

    if (!response.ok) {
      // Handle invalid phone number error - retry without phone number
      if (
        response.status === 400 &&
        data.code === 'invalid_parameter' &&
        data.message?.includes('phone')
      ) {
        // Remove SMS attribute and retry
        const attributesWithoutPhone = { ...attributes }
        delete attributesWithoutPhone.SMS

        const retryBody: any = {
          attributes: attributesWithoutPhone,
          listIds: params.listIds || [],
        }

        // Add tags if provided
        if (params.tags && params.tags.length > 0) {
          retryBody.tags = params.tags
        }

        const retryResponse = await fetch(url, {
          method: 'PUT',
          headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(retryBody),
        })

        // Safely parse retry JSON response
        let retryData: any = {}
        const retryResponseText = await retryResponse.text()

        if (retryResponseText && retryResponseText.trim()) {
          try {
            retryData = JSON.parse(retryResponseText)
          } catch (parseError) {
            // If retry response is successful but JSON is invalid, treat as success
            if (retryResponse.ok) {
              return { success: true, data: { id: 0 } as BrevoContactResponse }
            }
          }
        } else if (retryResponse.ok) {
          // Empty response but OK status
          return { success: true, data: { id: 0 } as BrevoContactResponse }
        }

        if (retryResponse.ok) {
          return { success: true, data: retryData as BrevoContactResponse }
        } else {
          // If retry also fails, return the original error
          const errorMessage =
            (data as BrevoErrorResponse).message || `Brevo API error: ${response.statusText}`
          return { success: false, error: errorMessage }
        }
      }

      const errorMessage =
        (data as BrevoErrorResponse).message || `Brevo API error: ${response.statusText}`
      return { success: false, error: errorMessage }
    }

    return { success: true, data: data as BrevoContactResponse }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: errorMessage }
  }
}

/**
 * Add a contact to Brevo with newsletter signup context
 * This is specifically for newsletter signups (not full user registration)
 * @param email Contact email
 * @param name Optional contact name
 * @param phoneNumber Optional phone number
 * @returns Promise with success status
 */
export async function addNewsletterSubscriber(
  email: string,
  name?: string,
  _phoneNumber?: string, // Phone number excluded from newsletter signups
): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: 'Email is required' }
  }

  // Parse name into first and last name if provided
  const attributes: BrevoContactAttributes = {}
  if (name) {
    const nameParts = name.trim().split(/\s+/)
    if (nameParts.length > 0) {
      attributes.FIRSTNAME = nameParts[0]
      if (nameParts.length > 1) {
        attributes.LASTNAME = nameParts.slice(1).join(' ')
      }
    }
  }

  const result = await createOrUpdateBrevoContact({
    email,
    attributes,
    updateEnabled: true,
  })

  return {
    success: result.success,
    error: result.error,
  }
}
