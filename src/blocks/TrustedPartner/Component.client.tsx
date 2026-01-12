'use client'
//Component.client.tsx
import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'
import { TrustedPartner, Media } from '@/payload-types'
import Image from 'next/image'
// import { TripAdvisorWidget } from '@/components/TripAdvisorWidget'

interface TrustedPartnerClientProps {
  heading?: string
  headingTextColor?: string
  subheading?: string
  subheadingTextColor?: string
  partners?: TrustedPartner[]
}

const TrustedPartnerClient: React.FC<TrustedPartnerClientProps> = ({
  heading,
  headingTextColor = 'text-black',
  subheading,
  subheadingTextColor = 'text-gray',
  partners = [],
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  // Auto-rotation every 4 seconds
  useEffect(() => {
    if (isPaused || partners.length <= 4) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const totalSlides = Math.ceil(partners.length / 4)
        return (prev + 1) % totalSlides
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused, partners.length])

  if (partners.length === 0) {
    return null
  }

  // Helper to get logo URL from Media object
  const getLogoUrl = (logo: number | Media | null | undefined): string | null => {
    if (!logo) return null
    if (typeof logo === 'object' && 'url' in logo) {
      return logo.url || null
    }
    return null
  }

  // Get current 4 partners to display
  const getCurrentPartners = () => {
    if (partners.length <= 4) {
      return partners
    }

    const startIndex = currentSlide * 4
    let currentPartners = partners.slice(startIndex, startIndex + 4)

    // If we don't have 4 partners, wrap around to the beginning
    if (currentPartners.length < 4) {
      const remainingNeeded = 4 - currentPartners.length
      currentPartners = [...currentPartners, ...partners.slice(0, remainingNeeded)]
    }

    return currentPartners
  }

  const currentPartners = getCurrentPartners()
  const totalSlides = Math.ceil(partners.length / 4)

  return (
    <div
      className={cn('w-full py-10 bg-white trusted-partner-block flex items-center justify-center')}
    >
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center">
          {heading && (
            <h2 className={cn('text-2xl md:text-3xl font-bold mb-3 uppercase', headingTextColor)}>
              {heading}
            </h2>
          )}
          {subheading && (
            <h3 className={cn('text-base md:text-lg mb-4', subheadingTextColor)}>{subheading}</h3>
          )}

          <div
            className="relative w-full py-6 overflow-hidden flex items-center justify-center"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Carousel container */}
            <div
              ref={carouselRef}
              className="flex gap-8 items-center justify-center transition-all duration-1000 ease-in-out"
            >
              {/* Display current 4 partners */}
              {currentPartners.map((partner, idx) => {
                const partnerId = `${currentSlide}-${idx}-${partner.id || idx}`
                const url = getLogoUrl(partner.logo)

                const content = (
                  <div
                    key={partnerId}
                    className="relative flex-shrink-0 h-20 w-36 flex items-center justify-center bg-white transition-all duration-300 group"
                    onMouseEnter={() => setHoveredPartner(partnerId)}
                    onMouseLeave={() => setHoveredPartner(null)}
                  >
                    {url ? (
                      <>
                        <Image
                          src={url}
                          alt={partner.name || 'Partner Logo'}
                          width={140}
                          height={80}
                          className="transition-opacity duration-300 group-hover:opacity-70"
                          style={{
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%',
                          }}
                          onClick={() => {
                            console.log('partner', url)
                          }}
                        />
                        {/* Company name overlay on hover */}
                        {hoveredPartner === partnerId && partner.name && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm font-medium px-2 text-center transition-all duration-300">
                            {partner.name}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )

                // Wrap with link if website is available
                if (partner.website && partner.website.link && partner.website.link.url) {
                  return (
                    <Link
                      key={`${partnerId}-link`}
                      href={partner.website.link.url}
                      target={partner.website.link.newTab ? '_blank' : '_self'}
                      rel={partner.website.link.newTab ? 'noopener noreferrer' : undefined}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      {content}
                    </Link>
                  )
                }

                return content
              })}

              {/* TripAdvisor widget if we have less than 4 partners */}
              {/* {currentPartners.length < 4 && <TripAdvisorWidget key="tripadvisor-widget" />} */}
            </div>

            {/* Navigation arrows */}
            {partners.length > 4 && (
              <>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
                  className="absolute top-1/2 -translate-y-1/2 z-10 left-2 -translate-x-1 bg-mustard text-white rounded-full p-1 sm:p-2 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Previous slide group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
                  className="absolute top-1/2 -translate-y-1/2 z-10 right-2 translate-x-1 bg-mustard text-white rounded-full p-1 sm:p-2 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Next slide group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrustedPartnerClient
