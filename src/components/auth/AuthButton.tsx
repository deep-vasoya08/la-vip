'use client'

import React from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LoginRegisterForm } from './LoginRegisterForm'
import { ProfileDropdown } from './ProfileDropdown'

/**
 * Main AuthButton component that serves as a container
 * Renders either the login/register form or the profile dropdown based on authentication status
 */
export const AuthButton = ({ className }: { className?: string }) => {
  const { data: session, status } = useSession()
  const isMobile = className?.includes('mobile')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={`flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${className || ''} ${isMobile ? 'justify-center' : ''}`}
        >
          <Image
            src="/images/Profile.svg"
            alt="Profile"
            width={isMobile ? 20 : 24}
            height={isMobile ? 20 : 24}
          />
        </div>
      </DropdownMenuTrigger>

      {status === 'unauthenticated' ? (
        <LoginRegisterForm isMobile={isMobile} />
      ) : (
        <ProfileDropdown session={session} isMobile={isMobile} />
      )}
    </DropdownMenu>
  )
}
