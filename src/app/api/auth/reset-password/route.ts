import { NextResponse, NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({
      config,
    })

    // Find user by reset token
    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        resetPasswordToken: {
          equals: token,
        },
      },
    })

    if (users.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 })
    }

    const user = users[0]

    // Check if token has expired
    const now = new Date()
    const expiry = new Date(user?.resetPasswordExpiration || '')

    if (now > expiry) {
      return NextResponse.json(
        { message: 'Your password reset link has expired. Please request a new one.' },
        { status: 400 },
      )
    }

    // Update user with new password and clear reset token fields
    if (user) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          password,
          resetPasswordToken: null,
          resetPasswordExpiration: null,
        },
      })
    }

    return NextResponse.json({ message: 'Password has been successfully reset' }, { status: 200 })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'An error occurred while resetting your password.' },
      { status: 500 },
    )
  }
}
