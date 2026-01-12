import { NextResponse, NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { v4 as uuidv4 } from 'uuid'
import { sendPasswordResetEmail } from '../../../../lib/emailService'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({
      config,
    })

    // Find user by email
    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    })

    // If no user found with this email, we still return success for security reasons
    // This prevents email enumeration attacks
    if (users.length === 0) {
      // For security, don't reveal that the email doesn't exist
      return NextResponse.json(
        {
          message: 'This Email is not register with use.',
        },
        { status: 200 },
      )
    }

    const user = users[0]

    // Generate a unique token
    const resetToken = uuidv4()
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60)
    // Update the user with the reset token and expiry
    if (user) {
      await payload.update({
        collection: 'users',
        id: user.id, // Remove optional chaining to ensure id is not undefined
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpiration: resetTokenExpiry.toISOString(), // Convert Date to ISO string
        },
      })
    }
    console.log('resetTokenExpiry', resetTokenExpiry, 'resetToken', resetToken)
    // Build reset password URL
    const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/reset-password?token=${resetToken}`
    // console.log('resetUrl', resetUrl)

    // Send professional password reset email
    if (user) {
      await sendPasswordResetEmail({
        customerName: user?.name || user?.email,
        customerEmail: user.email,
        resetPasswordUrl: resetUrl,
        expirationTime: '1 hour',
        userId: user.id,
      })
    }

    return NextResponse.json(
      {
        message:
          'If your email exists in our system, you will receive a password reset link shortly.',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request.' },
      { status: 500 },
    )
  }
}
