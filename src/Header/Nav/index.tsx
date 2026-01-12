'use client'

import React, { useState } from 'react'
import type { Footer, Header as HeaderType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface HeaderNavProps {
  data: HeaderType
  isMobile?: boolean
  closeMobileMenu?: () => void
  legalLinks?: Footer['legalLinks']
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  data,
  isMobile = false,
  closeMobileMenu = () => {},
  legalLinks = [],
}) => {
  const navItems = data?.navItems || []
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const pathname = usePathname()

  // Handle desktop hover or mobile click
  const handleInteraction = (index: number, hasSubItems: boolean) => {
    if (!hasSubItems) return

    if (isMobile) {
      // For mobile: toggle on click
      setActiveDropdown(activeDropdown === index ? null : index)
    } else {
      // For desktop, handled by mouse events
    }
  }

  if (isMobile) {
    // Mobile navigation
    return (
      <nav className="w-full bg-white">
        {navItems.map((item, i) => {
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isExpanded = activeDropdown === i

          return (
            <div key={i} className={isExpanded ? '' : 'border-b border-gray-100'}>
              {hasSubItems ? (
                <>
                  <div
                    className={`flex w-full items-center justify-between bg-white ${pathname === item.link.url ? 'text-[#FFDB58]' : 'text-black'}`}
                  >
                    <div onClick={closeMobileMenu} className="flex-1">
                      <CMSLink
                        {...item.link}
                        appearance="link"
                        label={item.link.label?.toUpperCase()}
                        className={`uppercase block py-3 px-4 text-left font-bold !no-underline ${pathname === item.link.url ? 'text-mustard' : 'text-black'}`}
                      />
                    </div>
                    <button
                      className="py-3 px-4 text-black"
                      onClick={() => handleInteraction(i, hasSubItems)}
                      aria-label={`Toggle ${item.link.label} submenu`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="bg-white text-black border-b border-gray-100 -mt-3">
                      {item.subItems?.map((subItem, j) => (
                        <div key={j} onClick={closeMobileMenu} className="font-bold">
                          <CMSLink
                            {...subItem.link}
                            appearance="link"
                            label={subItem.link.label?.toUpperCase()}
                            className={`uppercase text-sm py-2 px-2 pl-8 text-left font-bold !no-underline ${pathname === subItem.link.url ? 'text-mustard' : 'text-black'}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  onClick={closeMobileMenu}
                  className={`!capitalize bg-white flex items-center justify-between ${pathname === item.link.url ? 'text-mustard' : 'text-black'}`}
                >
                  <CMSLink
                    {...item.link}
                    appearance="link"
                    label={item.link.label?.toUpperCase()}
                    className={`uppercase block py-3 px-4 text-left flex-1 font-bold !no-underline ${pathname === item.link.url ? 'text-mustard' : 'text-black'}`}
                  />
                  <ChevronRight className="h-5 w-5 ml-auto mr-4" />
                </div>
              )}
            </div>
          )
        })}
        {/* Legal Links for mobile */}
        {legalLinks && legalLinks.length > 0 && (
          <div className="py-4 px-4 flex flex-col items-start gap-5">
            {legalLinks.map((linkObj, idx) => (
              <CMSLink
                key={idx}
                {...linkObj.link}
                className="capitalize text-black font-roboto text-sm"
              />
            ))}
          </div>
        )}
      </nav>
    )
  }

  // Desktop navigation with your CSS classes
  return (
    <nav className="!capitalize flex md:items-center sm:items-start font-semplicita">
      {navItems.map(({ link, subItems }, i) => {
        const hasDropdown = subItems && subItems.length > 0

        return (
          <div
            key={i}
            className="relative group"
            onMouseEnter={() => hasDropdown && setActiveDropdown(i)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {/* Main nav item */}
            <div className="flex items-center h-full">
              <CMSLink
                {...link}
                appearance="link"
                label={link.label?.toUpperCase()}
                className={`text-black hover:text-mustard uppercase px-3 font-bold text-sm !no-underline ${
                  pathname === link.url ||
                  (link.reference?.value &&
                    typeof link.reference.value === 'object' &&
                    'slug' in link.reference.value &&
                    pathname === `/${link.reference.value.slug}`)
                    ? 'text-mustard'
                    : ''
                }`}
              />

              {/* Dropdown menu - using your CSS classes */}
              {hasDropdown && activeDropdown === i && (
                <div className="!no-underline dropdown-menu text-sm absolute top-full left-0 bg-white shadow-md py-2 z-50 min-w-[200px]">
                  {subItems.map((subItem, j) => {
                    const isSubActive =
                      pathname === subItem.link.url ||
                      (subItem.link.reference &&
                        typeof subItem.link.reference.value === 'object' &&
                        subItem.link.reference.value?.slug &&
                        pathname === `/${subItem.link.reference.value.slug}`)

                    return (
                      <CMSLink
                        key={j}
                        {...subItem.link}
                        appearance="link"
                        label={subItem.link.label?.toUpperCase()}
                        className={`uppercase dropdown-item block px-4 hover:bg-gray-100 !no-underline ${isSubActive ? 'text-mustard' : 'text-black'}`}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
