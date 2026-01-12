import { NextResponse, NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../options'

export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 },
      )
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
          equals: session.user.email,
        },
      },
    })

    if (users.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const user = users[0]

    // Verify current password
    try {
      await payload.login({
        collection: 'users',
        data: {
          email: session.user.email,
          password: currentPassword,
        },
      })
    } catch (error) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 })
    }

    // Update password
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Invalid user data' }, { status: 400 })
    }
    
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: newPassword,
      },
    })

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { message: 'An error occurred while changing your password.' },
      { status: 500 },
    )
  }
}
