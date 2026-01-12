import { NextResponse, NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 })
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
      return NextResponse.json({ message: 'Invalid reset token' }, { status: 400 })
    }

    const user = users[0]

    // Check if token has expired
    const now = new Date()
    const expiry = new Date(user?.resetPasswordExpiration || '')

    if (now > expiry) {
      return NextResponse.json({ message: 'Reset token has expired' }, { status: 400 })
    }

    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { message: 'An error occurred while verifying the reset token.' },
      { status: 500 },
    )
  }
}
