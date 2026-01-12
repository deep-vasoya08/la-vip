'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import { DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimatePresence, easeInOut, motion } from 'framer-motion'
import { CMSLink } from '../Link'

/**
 * ProfileDropdown component
 * Displays user information and navigation options for authenticated users
 */
interface ProfileDropdownProps {
  session: Session | null
  isMobile?: boolean
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ session, isMobile }) => {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Animation variants for change password form
  const formVariants = {
    hidden: {
      y: 10,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
    exit: {
      y: -10,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred')
      }

      setSuccess(true)
      // Clear form fields after successful update
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      console.error('Password change error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while changing your password. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setShowChangePassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
  }

  return (
    <DropdownMenuContent
      align="end"
      style={{
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e5e5e5',
      }}
      className={`${isMobile ? 'w-[300px]' : 'w-[380px]'} !no-underline text-sm bg-white z-50`}
    >
      <DropdownMenuItem asChild>
        <div className="px-4 py-2 cur">
          <p className="!text-md !font-medium truncate !font-semibold !text-black !hover:text-white">
            {session?.user?.name}
          </p>
          <p className="!text-xs !truncate !font-roboto !text-black !hover:text-white">
            {session?.user?.email}
          </p>
        </div>
      </DropdownMenuItem>

      {/* My Account */}
      <DropdownMenuItem asChild>
        <CMSLink
          url="/my-account"
          appearance="link"
          key={1}
          label="My Account"
          className="uppercase dropdown-item block px-4 py-2 hover:bg-gray-100 !no-underline text-black"
        />
      </DropdownMenuItem>

      {/* Admin Dashboard */}
      {session?.user?.role === 'admin' && (
        <DropdownMenuItem asChild>
          <CMSLink
            key={2}
            url="/admin"
            appearance="link"
            label="Admin Dashboard"
            className="uppercase dropdown-item block px-4 py-2 hover:bg-gray-100 !no-underline text-black"
          />
        </DropdownMenuItem>
      )}

      {/* Change Password */}
      <DropdownMenuItem asChild>
        <div
          className="cursor-pointer items-center uppercase dropdown-item justify-center items-center block hover:bg-mustard hover:text-white !no-underline text-black"
          onClick={(e) => {
            e.preventDefault()
            setShowChangePassword(true)
          }}
          // onSelect={(e) => e.preventDefault()}
        >
          Change Password
        </div>
      </DropdownMenuItem>
      {/* <iframe
        src="/auth/change-password"
        title="Change Password"
        className="w-full h-[300px]"
        // style={{ display: showChangePassword ? 'block' : 'none' }}
        ref={changePasswordIframeRef}
      /> */}

      {showChangePassword && (
        <div className="p-4 bg-beige rounded-sm mt-1">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={formVariants}
                className="bg-green-100 text-green-800 rounded-[20px] p-4 text-sm font-roboto"
              >
                <p className="font-semibold mb-2">Password Changed Successfully!</p>
                <p>Your password has been updated. You can now use your new password to log in.</p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={formVariants}
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="text-md font-bold text-mustard font-semplicita">CHANGE PASSWORD</p>
                  <Button
                    variant="default"
                    size="small"
                    className="p-1 bg-transparent hover:bg-transparent"
                    onClick={resetForm}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-black"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                </div>

                {error && (
                  <div className="bg-red-100 text-red-800 p-3 rounded-sm text-sm font-roboto">
                    {error}
                  </div>
                )}

                <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="!bg-white !text-black font-roboto"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="clear"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={isLoading}
                    >
                      <Image
                        src={showCurrentPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                        alt={showCurrentPassword ? 'Hide Password' : 'Show Password'}
                        width={20}
                        height={20}
                      />
                    </Button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      className="!bg-white !text-black font-roboto"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="clear"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      <Image
                        src={showNewPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                        alt={showNewPassword ? 'Hide Password' : 'Show Password'}
                        width={20}
                        height={20}
                      />
                    </Button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="!bg-white !text-black font-roboto"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="clear"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      <Image
                        src={showConfirmPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                        alt={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                        width={20}
                        height={20}
                      />
                    </Button>
                  </div>

                  <div className="w-full flex justify-center items-center mt-4">
                    <Button
                      type="submit"
                      variant="mustard"
                      className="w-full uppercase"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Sign Out */}
      <DropdownMenuItem asChild>
        <div
          className="cursor-pointer uppercase dropdown-item block px-4 py-2 hover:bg-mustard !hover:text-white !no-underline text-red-600"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sign Out
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
