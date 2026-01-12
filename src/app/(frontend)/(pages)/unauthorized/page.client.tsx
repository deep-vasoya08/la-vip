'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export default function UnauthorizedClient() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="bg-white rounded-md shadow-md p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-semibold text-mustard font-semplicita mb-4">Access Denied</h1>

        <p className="text-black/80 font-roboto mb-6">
          You don&apos;t have permission to access this page. This area requires additional
          privileges.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/">
            <Button variant="mustard">Return to Home</Button>
          </Link>

          {isAuthenticated && (
            <Link href="/my-account">
              <Button variant="mustard">Go to Profile</Button>
            </Link>
          )}

          {!isAuthenticated && (
            <Link href="/auth/login">
              <Button variant="mustard">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
