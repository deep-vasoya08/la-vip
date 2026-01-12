import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendWelcomeEmail } from '@/lib/emailService'
import { createOrUpdateBrevoContact } from '@/lib/brevo'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phoneNumber, receiveTexts } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 },
      )
    }

    // Initialize Payload
    const payload = await getPayload({
      config,
    })

    // Check if user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    })

    if (existingUsers.docs.length > 0) {
      return NextResponse.json(
        { message: 'A user with this email already exists' },
        { status: 409 },
      )
    }

    // Create the user
    const user = await payload.create({
      collection: 'users',
      data: {
        name,
        email,
        password,
        role: 'user', // Default role
        // Add custom fields if they exist in your schema
        phoneNumber,
        receiveTexts,
      },
    })

    // Remove sensitive data before returning
    const { password: _, ...userData } = user

    // Parse name into first and last name for Brevo
    const nameParts = userData.name?.trim().split(/\s+/) || []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    // Add contact to Brevo CRM
    if (userData.email) {
      // Build attributes object with name and phone number
      const attributes: Record<string, string> = {
        FIRSTNAME: firstName,
        LASTNAME: lastName,
      }

      // Use static phone number for testing (remove this after testing)
      const staticPhoneNumber = '+4242487714' // +1 424-248-7713
      attributes.SMS = staticPhoneNumber

      const brevoResult = await createOrUpdateBrevoContact({
        email: userData.email,
        attributes,
        listIds: [12], // laviptours.com Signup
        updateEnabled: true,
      })

      // Single log for Brevo sync result
      console.log('[User Registration Brevo Sync]', {
        status: brevoResult.success ? 'success' : 'failed',
        email: userData.email,
        listId: 12,
        contactId: brevoResult.data?.id || null,
        error: brevoResult.error || null,
      })
    }

    // Send professional welcome email
    if (userData.email && userData.name) {
      const emailResult = await sendWelcomeEmail({
        customerName: userData.name,
        customerEmail: userData.email,
        customerPhoneNumber: userData.phoneNumber || '',
        userId: userData.id,
      })

      if (!emailResult.success) {
        console.error('Failed to send welcome email:', emailResult.error)
        // Don't fail the registration just because email failed
      }
    }

    return NextResponse.json(
      {
        message: 'User registered successfully! Welcome email sent.',
        user: userData,
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    console.error('Error registering user:', error)

    // Handle validation errors from Payload
    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: (error as { errors: unknown }).errors,
        },
        { status: 400 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Error registering user'
    return NextResponse.json({ message: errorMessage }, { status: 500 })
  }
}
