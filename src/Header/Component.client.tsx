'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AuthButton } from '@/components/auth/AuthButton'

import type { Footer, Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'
import { HeaderNav } from './Nav'
import Image from 'next/image'
import { formatPhone } from '@/utilities/textFormatting'

interface HeaderClientProps {
  headerData: Header
  footerData: Footer
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ headerData, footerData }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // console.log(pathname)
    setHeaderTheme(null)
  }, [pathname, setHeaderTheme])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
  }, [headerTheme, theme])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className="bg-white text-black z-20 shadow-lg"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center mr-auto pl-0">
            <Logo loading="eager" priority="high" />
          </Link>

          {/* Desktop Navigation and Icons */}
          <div className="hidden md:flex items-end gap-4">
            <HeaderNav data={headerData} />

            <a
              href={`tel:${footerData?.phone}`}
              className="flex items-center text-yellow-400 font-bold"
            >
              <Image
                src="/images/phone-solid.svg"
                alt="Phone"
                width={16}
                height={16}
                className="mr-2"
              />
              <span>{formatPhone(footerData?.phone || '')}</span>
            </a>

            {/* Request a Quote Button */}
            {/* <CMSLink
              type="custom"
              url="/contact"
              label="Request a Quote"
              appearance="default"
              size="small"
              className="ml-4"
            /> */}
            <Button className="text-center" variant="mustard" size="small">
              <Link href="/request-quote">REQUEST A QUOTE</Link>
            </Button>

            {/* Search Icon */}
            <Link href="/search" className="text-black hover:text-yellow-400">
              <span className="sr-only">Search</span>
              <Image src="/images/magnifying-glass-solid.svg" alt="Search" width={20} height={20} />
            </Link>

            <AuthButton />
          </div>

          {/* Mobile Controls - rearranged with hamburger at the end */}
          <div className="flex md:hidden items-center gap-4">
            <a href={`tel:${footerData?.phone}`} className="text-yellow-400">
              <Image
                src="/images/phone-solid.svg"
                alt="Phone"
                width={16}
                height={16}
                className="mr-2"
              />
            </a>

            <Link href="/search" className="text-black hover:text-yellow-400">
              <Image src="/images/magnifying-glass-solid.svg" alt="Search" width={20} height={20} />
            </Link>
            <AuthButton className="mobile" />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-black hover:text-yellow-400"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - taking full viewport height */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[80px] bg-white z-50 overflow-y-auto">
          {/* Request a Quote Button for Mobile */}
          <div className="bg-white py-4 flex justify-center pr-[0.8rem]">
            <Button className="text-center" variant="mustard" size="small">
              <Link href="/request-quote">REQUEST A QUOTE</Link>
            </Button>
          </div>
          <div className="container mx-auto py-4 pt-1">
            {/* Mobile Navigation */}
            <HeaderNav
              data={headerData}
              isMobile={true}
              closeMobileMenu={() => setMobileMenuOpen(false)}
              legalLinks={footerData?.legalLinks}
            />
          </div>
        </div>
      )}
    </header>
  )
}
