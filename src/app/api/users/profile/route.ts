import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/options'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(req: NextRequest) {
  try {
    // Get the session using NextAuth
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Initialize Payload
    const payload = await getPayload({ config })

    // Convert user ID to number (consistent with other parts of codebase)
    const userId = Number(session.user.id)

    // Get user data from Payload CMS
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        receiveTexts: user.receiveTexts,
      },
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Get the session using NextAuth
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { phoneNumber, receiveTexts } = body

    // Initialize Payload
    const payload = await getPayload({ config })

    // Convert user ID to number (consistent with other parts of codebase)
    const userId = Number(session.user.id)

    // Update user data in Payload CMS
    const updatedUser = await payload.update({
      collection: 'users',
      id: userId,
      data: {
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(receiveTexts !== undefined && { receiveTexts }),
      },
    })

    // Return updated user data
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        receiveTexts: updatedUser.receiveTexts,
      },
    })
  } catch (error) {
    console.error('Error updating user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
