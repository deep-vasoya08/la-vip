import Link from 'next/link'
import React from 'react'
import { Home, Search, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-light-beige flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8 border border-gray-200">
          {/* 404 Number with Gradient */}
          <div className="mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-mustard font-semplicita leading-none">
              404
            </h1>
          </div>

          {/* Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-mustard rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Main Message */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray mb-4 font-semplicita">
            Oops! Page Not Found
          </h2>

          <p className="text-lg text-mild-gray mb-8 font-roboto leading-relaxed">
            It looks like you&apos;ve taken a detour from your planned route. The page you&apos;re
            looking for doesn&apos;t exist or has been moved to a new location.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="mustard">
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>

            <Button asChild variant="mustard">
              <Link href="/tours" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Browse Tours
              </Link>
            </Button>
          </div>
        </div>

        {/* Additional Help Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
          <h3 className="text-lg font-semibold text-gray mb-3 font-semplicita">
            Need Help Finding Something?
          </h3>
          <p className="text-mild-gray mb-4 font-roboto">
            Try these popular destinations or contact our team for assistance.
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            <Button asChild size="small">
              <Link href="/events">Events</Link>
            </Button>
            <Button asChild size="small">
              <Link href="/my-account">My Account</Link>
            </Button>
            <Button asChild size="small">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild size="small">
              <Link href="/request-quote">Request Quote</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
