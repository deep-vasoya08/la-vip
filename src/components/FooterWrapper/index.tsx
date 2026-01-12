'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export const FooterWrapper: React.FC<Props> = ({ children }) => {
  const pathname = usePathname()

  // Check if the current path is an auth route
  const isAuthRoute =
    // pathname?.includes('/auth/') ||
    // pathname?.includes('/login') ||
    // pathname?.includes('/register') ||
    // pathname?.includes('/forgot-password') ||
    // pathname?.includes('/my-account') ||
    pathname?.includes('/request-quote')

  // Always return a consistent wrapper div to maintain DOM structure
  return <div style={{ display: isAuthRoute ? 'none' : 'block' }}>{children}</div>
}
