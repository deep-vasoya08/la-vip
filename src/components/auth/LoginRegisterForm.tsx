'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DropdownMenuContent } from '@/components/ui/dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { easeInOut } from 'framer-motion'

/**
 * ForgotPasswordForm component
 * Handles password reset request form
 */
const ForgotPasswordForm = ({ onBackToLogin }: { onBackToLogin: () => void }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Animation variants for form transitions
  const formVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easeInOut,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred')
      }

      setSuccess(true)
    } catch (err) {
      console.error('Password reset request error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <motion.h5
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center font-bold text-mustard font-semplicita"
      >
        FORGOT PASSWORD
      </motion.h5>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-red-100 text-red-800 p-3 rounded-md my-3 text-sm font-roboto"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.div
            key="success"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-green-100 text-green-800 p-4 rounded-md my-4 text-sm font-roboto"
          >
            <p className="font-semibold mb-2">Password Reset Email Sent!</p>
            <p>
              If an account exists with the email you entered, you will receive a password reset
              link shortly.
            </p>
            <div className="mt-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button variant="mustard" className="w-full" onClick={onBackToLogin}>
                  Return to Login
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-4"
          >
            <p className="text-md text-black my-4 font-roboto text-center">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Input
                  type="email"
                  className="!bg-white !text-black font-roboto pl-10"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-500"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
              </div>

              <motion.div
                className="w-full flex justify-center items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  variant="mustard"
                  className="w-full uppercase"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const tabTransition = {
  type: 'tween' as 'tween' | 'spring',
  ease: easeInOut,
  duration: 0.3,
}

/**
 * LoginRegisterForm component
 * Handles user authentication forms with login, register, and forgot password tabs
 */
export const LoginRegisterForm = ({ isMobile }: { isMobile?: boolean }) => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [_contentHeight, setContentHeight] = useState('')
  const dropdownRef = useRef(null)

  // Determine callback URL from query or fall back to current URL
  const getCallbackUrl = (): string => {
    try {
      if (typeof window === 'undefined') return '/'
      const params = new URLSearchParams(window.location.search)
      const fromParam = params.get('callbackUrl')
      if (fromParam) return fromParam
      // Fallback: current page to avoid dumping user to home unintentionally
      return window.location.href || '/'
    } catch {
      return '/'
    }
  }

  // Handle content height adjustments for proper scrolling
  useEffect(() => {
    // Allow scrolling when content is taller than viewport
    const updateHeight = () => {
      if (dropdownRef.current) {
        const viewportHeight = window.innerHeight
        const maxHeight = Math.max(400, viewportHeight * 0.85) // At least 400px, up to 85% of viewport
        setContentHeight(`${maxHeight}px`)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Scroll to top when tab changes
  // useEffect(() => {
  //   if (dropdownRef.current) {
  //     // dropdownRef.current.scrollTop = 0
  //   }
  // }, [activeTab])

  // Animation variants for tab content transitions
  const tabVariants = {
    hidden: (direction: number) => ({
      x: direction * 20,
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: tabTransition,
    },
    exit: (direction: number) => ({
      x: direction * -20,
      opacity: 0,
      transition: tabTransition,
    }),
  }

  // Handle tab change with proper scroll reset
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setError('')
    setPhoneError('') // Clear phone error when changing tabs
    // Reset scroll position when changing tabs
    setTimeout(() => {
      const container = document.querySelector('.auth-dropdown-content')
      if (container) {
        container.scrollTop = 0
      }
    }, 10)
  }

  // Register form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    receiveTexts: false,
  })
  const [phoneError, setPhoneError] = useState('')

  // Phone number validation for US phone numbers
  const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; message: string } => {
    // Remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // Check if it's empty
    if (!cleanPhone) {
      return { isValid: false, message: 'Phone number is required' }
    }

    // Check if it has the right length
    if (cleanPhone.length !== 10) {
      return { isValid: false, message: 'Phone number must be 10 digits' }
    }

    return { isValid: true, message: '' }
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleanPhone = value.replace(/\D/g, '')

    // Apply formatting based on length
    if (cleanPhone.length <= 3) {
      return cleanPhone
    } else if (cleanPhone.length <= 6) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3)}`
    } else {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6, 10)}`
    }
  }

  // Register form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'phoneNumber') {
      // Format the phone number as user types
      const formattedPhone = formatPhoneNumber(value)
      setFormData((prev) => ({
        ...prev,
        [name]: formattedPhone,
      }))

      // Clear phone error when user starts typing
      if (phoneError) {
        setPhoneError('')
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      receiveTexts: checked,
    }))
  }

  // Handle login form submission
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: getCallbackUrl(),
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (result?.url) {
        router.push(result.url || getCallbackUrl())
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login. Please try again.')
      setIsLoading(false)
    }
  }

  // Handle register form submission
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setPhoneError('')

    // Validate phone number before submission
    const phoneValidation = validatePhoneNumber(formData.phoneNumber)
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message)
      setIsLoading(false)
      return
    }

    try {
      // Create name from first and last name
      const name = `${formData.firstName} ${formData.lastName}`.trim()

      // Register the user with Payload
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber.replace(/\D/g, ''), // Send clean phone number to backend
          receiveTexts: formData.receiveTexts,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register')
      }

      // If registration was successful, sign in the user automatically
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error('Registration successful but login failed. Please login manually.')
      }

      // Redirect to callback URL or profile page after successful registration and login
      // const currentUrl = window.location.href
      const urlParams = new URLSearchParams(window.location.search)
      const callbackUrl = urlParams.get('callbackUrl') || '/my-account'

      router.push(callbackUrl)
    } catch (err) {
      console.error('Registration error:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenuContent
      align="end"
      ref={dropdownRef}
      style={{
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e5e5e5',
      }}
      className={`${isMobile ? 'w-[300px]' : 'w-[380px]'} !no-underline text-sm bg-white z-50`}
    >
      <div
        className={`${isMobile ? 'w-[300px]' : 'w-[380px]'} flex items-center justify-center rounded-sm p-4 bg-white`}
      >
        <div className="w-full px-4">
          {activeTab !== 'forgot-password' && (
            <h5 className="text-center font-bold text-mustard font-semplicita">YOUR ACCOUNT</h5>
          )}

          {/* Tab navigation */}
          {activeTab !== 'forgot-password' && (
            <div className="flex justify-center mt-3 mb-4 border-gray-300">
              <button
                onClick={() => {
                  handleTabChange('login')
                }}
                className={`px-4 py-2 font-roboto relative ${
                  activeTab === 'login'
                    ? 'text-mustard font-semibold'
                    : 'text-gray-600 hover:text-mustard'
                }`}
              >
                Login
                {activeTab === 'login' && (
                  <motion.div
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-mustard"
                    layoutId="tabIndicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </button>
              <button
                onClick={() => {
                  handleTabChange('register')
                }}
                className={`px-4 py-2 font-roboto relative ${
                  activeTab === 'register'
                    ? 'text-mustard font-semibold'
                    : 'text-gray-600 hover:text-mustard'
                }`}
              >
                Register
                {activeTab === 'register' && (
                  <motion.div
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-mustard"
                    layoutId="tabIndicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </button>
            </div>
          )}

          {activeTab !== 'forgot-password' && error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-md mb-3 text-sm font-roboto">
              {error}
            </div>
          )}

          {/* Forgot Password Form */}
          {activeTab === 'forgot-password' ? (
            <ForgotPasswordForm onBackToLogin={() => handleTabChange('login')} />
          ) : (
            <>
              {/* Social login buttons - shown for both login/register tabs */}
              <div className="mb-4 overflow-y-visible">
                <p className="text-md text-black mb-3 font-roboto text-center">Continue with:</p>
                <div className="flex gap-3 mb-4">
                  <Button
                    variant="default"
                    size="clear"
                    className="w-full flex items-center justify-center border-2 border-gray/30 rounded-full p-3 hover:shadow-md hover:border-mustard transition-all duration-300"
                    onClick={() => {
                      setIsLoading(true)
                      signIn('google', { callbackUrl: getCallbackUrl() })
                    }}
                    disabled={isLoading}
                  >
                    <Image src="/images/google-icon.svg" alt="Google" width={28} height={28} />
                  </Button>
                  {/* <Button
                    variant="default"
                    size="clear"
                    className="flex items-center justify-center w-1/2 border-2 border-gray/30 rounded-full p-3 hover:shadow-md hover:border-mustard transition-all duration-300"
                    onClick={() => {
                      setIsLoading(true)
                      signIn('apple', { callbackUrl: getCallbackUrl() })
                    }}
                    disabled={isLoading}
                  >
                    <Image src="/images/apple-icon.svg" alt="Apple" width={28} height={28} />
                  </Button> */}
                </div>

                {/* Form container with animations */}
                <AnimatePresence mode="wait" initial={false}>
                  {/* Login Form */}
                  {activeTab === 'login' && (
                    <motion.div
                      key="login"
                      custom={-1}
                      variants={tabVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <p className="text-md text-black mb-3 font-roboto text-center">
                        Or Login with Email:
                      </p>
                      <form className="space-y-4" onSubmit={handleLoginSubmit}>
                        <div>
                          <Input
                            type="email"
                            className="!bg-white !text-black font-roboto"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            className="!bg-white !text-black font-roboto"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="clear"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            <Image
                              src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                              alt={showPassword ? 'Hide Password' : 'Show Password'}
                              width={20}
                              height={20}
                            />
                          </Button>
                        </div>

                        <div className="flex justify-end mt-1 mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleTabChange('forgot-password')
                            }}
                            className="text-sm text-mustard hover:underline font-roboto"
                          >
                            Forgot Password?
                          </button>
                        </div>

                        <div className="w-full flex justify-center items-center">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full"
                          >
                            <Button
                              type="submit"
                              variant="mustard"
                              className="w-full uppercase"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Logging in...
                                </span>
                              ) : (
                                'Log In'
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Register Form */}
                  {activeTab === 'register' && (
                    <motion.div
                      key="register"
                      custom={1}
                      variants={tabVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <p className="text-md text-black mb-3 font-roboto text-center">
                        Or Register with Email:
                      </p>
                      <form className="space-y-3 pb-1" onSubmit={handleRegisterSubmit}>
                        <div>
                          <Input
                            type="text"
                            name="firstName"
                            className="!bg-white !text-black font-roboto"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="text"
                            name="lastName"
                            className="!bg-white !text-black font-roboto"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            name="email"
                            className="!bg-white !text-black font-roboto"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            className="!bg-white !text-black font-roboto"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="clear"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/70 p-0 bg-transparent hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            <Image
                              src={showPassword ? '/images/eye-off.svg' : '/images/eye.svg'}
                              alt={showPassword ? 'Hide Password' : 'Show Password'}
                              width={20}
                              height={20}
                            />
                          </Button>
                        </div>
                        <div>
                          <Input
                            type="tel"
                            name="phoneNumber"
                            className={`!bg-white !text-black font-roboto ${phoneError ? '!border-red-500' : ''}`}
                            placeholder="Phone Number"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            disabled={isLoading}
                            maxLength={14} // (XXX) XXX-XXXX format
                            required
                          />
                          {phoneError && (
                            <p className="text-red-500 text-xs mt-1 font-roboto">{phoneError}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="receiveTexts"
                            className="!border-black !rounded-xs"
                            checked={formData.receiveTexts}
                            onCheckedChange={handleCheckboxChange}
                            disabled={isLoading}
                          />
                          <Label htmlFor="receiveTexts" className="text-xs font-roboto text-black">
                            I&apos;d like to receive text messages
                          </Label>
                        </div>

                        <div className="text-xs text-left font-roboto text-black mt-2">
                          By continuing, you agree to LA VIP&apos;s{' '}
                          <Link
                            href="/terms-and-conditions"
                            className="text-mustard hover:underline font-semibold"
                          >
                            Terms
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy-policy"
                            className="text-mustard hover:underline font-semibold"
                          >
                            Privacy
                          </Link>
                        </div>

                        <div className="w-full flex justify-center items-center">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full"
                          >
                            <Button
                              type="submit"
                              variant="mustard"
                              className="w-full uppercase"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Creating Account...
                                </span>
                              ) : (
                                'Register'
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </DropdownMenuContent>
  )
}
