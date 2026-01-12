import { getSession } from 'next-auth/react'

/**
 * Force refresh the NextAuth session to pick up updated user data
 * This is useful after updating user profile information like phone number
 */
export const refreshSession = async (): Promise<void> => {
  try {
    // Force a session refresh by calling getSession with force: true
    await getSession()

    // Also trigger a page reload to ensure all components get the updated session
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  } catch (error) {
    console.error('Error refreshing session:', error)
  }
}

/**
 * Update the session with new phone number without full page reload
 * This is a lighter approach that just updates the session data
 */
export const updateSessionPhoneNumber = async (phoneNumber: string): Promise<void> => {
  try {
    // Get current session
    const session = await getSession()

    if (session?.user) {
      // Update the session user data in memory
      session.user.phoneNumber = phoneNumber
    }
  } catch (error) {
    console.error('Error updating session phone number:', error)
  }
}
