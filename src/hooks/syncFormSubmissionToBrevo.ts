import type { CollectionAfterChangeHook } from 'payload'
import { createOrUpdateBrevoContact } from '@/lib/brevo'
import type { FormSubmission } from '@/payload-types'

/**
 * Hook to sync form submissions to Brevo CRM
 * Adds contact to Brevo list ID 7 when a contact form is submitted
 */
export const syncFormSubmissionToBrevo: CollectionAfterChangeHook<FormSubmission> = async ({
  doc,
  req: { payload },
}) => {
  const logPrefix = '[Form Submission Brevo Sync]'

  try {
    // Only process if form submission has data
    if (
      !doc.submissionData ||
      !Array.isArray(doc.submissionData) ||
      doc.submissionData.length === 0
    ) {
      payload.logger.info(`${logPrefix} - No submission data, skipping Brevo sync`)
      return doc
    }

    // Extract email, name, and phone from submission data
    // Normalize field names: lowercase, remove spaces, handle various formats
    const submissionMap: Record<string, string> = {}
    const allFields: string[] = []

    doc.submissionData.forEach((item) => {
      if (item.field && item.value) {
        const normalizedField = item.field
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces

        submissionMap[normalizedField] = item.value
        allFields.push(`${item.field} = ${item.value}`)
      }
    })

    console.log(`${logPrefix} - All form fields extracted`, {
      fields: allFields,
      submissionMap: Object.keys(submissionMap),
    })

    // Helper function to find field by multiple possible names
    const findField = (possibleNames: string[]): string | undefined => {
      for (const name of possibleNames) {
        const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ')
        if (submissionMap[normalized]) {
          return submissionMap[normalized]
        }
        // Also try exact match
        if (submissionMap[name.toLowerCase()]) {
          return submissionMap[name.toLowerCase()]
        }
      }
      return undefined
    }

    // Look for email in various field names
    const email =
      findField([
        'email',
        'e-mail',
        'email address',
        'your email',
        'contact email',
        'e-mail address',
        'emailaddress',
      ]) ||
      // Fallback: find any field that contains "email" and looks like an email
      Object.values(submissionMap).find(
        (value) => typeof value === 'string' && value.includes('@') && value.includes('.'),
      )

    if (!email) {
      payload.logger.warn(`${logPrefix} - No email found in form submission, skipping Brevo sync`, {
        formId: doc.form,
        availableFields: Object.keys(submissionMap),
        allFields,
      })
      return doc
    }

    // Look for name in various field names
    const name =
      findField([
        'name',
        'full name',
        'your name',
        'contact name',
        'first name',
        'fullname',
        'contactname',
      ]) ||
      // Try combining first and last name
      (() => {
        const firstName = findField(['first name', 'firstname', 'fname'])
        const lastName = findField(['last name', 'lastname', 'lname'])
        if (firstName || lastName) {
          return `${firstName || ''} ${lastName || ''}`.trim()
        }
        return undefined
      })()

    // Look for phone in various field names
    const phone =
      findField([
        'phone',
        'phone number',
        'mobile',
        'contact phone',
        'your phone',
        'phonenumber',
        'telephone',
        'tel',
        'cell',
        'cell phone',
        'cellphone',
      ]) ||
      // Fallback: find any field that looks like a phone number
      Object.values(submissionMap).find(
        (value) =>
          typeof value === 'string' &&
          (value.replace(/\D/g, '').length >= 10 || value.includes('+') || value.includes('(')),
      )

    console.log(`${logPrefix} - Processing form submission`, {
      formId: doc.form,
      email,
      hasName: !!name,
      hasPhone: !!phone,
      submissionId: doc.id,
      timestamp: new Date().toISOString(),
    })

    // Parse name into first and last name
    const nameParts = name?.trim().split(/\s+/) || []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    // Build attributes object
    const attributes: Record<string, string> = {}
    if (firstName) {
      attributes.FIRSTNAME = firstName
    }
    if (lastName) {
      attributes.LASTNAME = lastName
    }

    // Use phone from form if available, otherwise use static phone number
    if (phone) {
      // Format phone number (will be formatted to E.164 in brevo.ts)
      attributes.SMS = phone
      console.log(`${logPrefix} - Using phone number from form`, {
        original: phone,
      })
    } else {
      // Add static phone number for testing (same as user registration)
      const staticPhoneNumber = '+14242487713' // +1 424-248-7713
      attributes.SMS = staticPhoneNumber
      console.log(`${logPrefix} - Using static phone number`, {
        staticPhone: staticPhoneNumber,
      })
    }

    console.log(`${logPrefix} - Syncing to Brevo`, {
      email,
      firstName,
      lastName,
      phone: phone || '+14242487713',
      listIds: [7],
    })

    // Add contact to Brevo with list ID 7
    const brevoResult = await createOrUpdateBrevoContact({
      email,
      attributes,
      listIds: [7], // Contact form list
      updateEnabled: true,
    })

    if (brevoResult.success) {
      console.log(`${logPrefix} - Successfully synced form submission to Brevo`, {
        formId: doc.form,
        submissionId: doc.id,
        email,
        brevoContactId: brevoResult.data?.id,
      })
      payload.logger.info(`${logPrefix} - Form submission synced to Brevo successfully`)
    } else {
      console.error(`${logPrefix} - Failed to sync form submission to Brevo`, {
        formId: doc.form,
        submissionId: doc.id,
        email,
        error: brevoResult.error,
      })
      payload.logger.error(`${logPrefix} - Failed to sync: ${brevoResult.error}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`${logPrefix} - Exception occurred`, {
      formId: doc.form,
      submissionId: doc.id,
      error: errorMessage,
    })
    payload.logger.error(`${logPrefix} - Exception: ${errorMessage}`)
    // Don't fail the form submission if Brevo sync fails
  }

  return doc
}
