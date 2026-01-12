import { useSession } from 'next-auth/react'

// Hook to get authentication status and user role
export const useAuth = () => {
  const { data: session, status } = useSession()
  // console.log('session useAuth', session)
  return {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isAdmin: session?.user?.role === 'admin',
    role: session?.user?.role,
  }
}

// Function to redirect based on role
export const checkAccess = (role: string | undefined, requiredRole: string = 'user') => {
  if (!role) return false

  if (requiredRole === 'admin') {
    return role === 'admin'
  }

  // User role can access user content
  return role === 'user' || role === 'admin'
}
