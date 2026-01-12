'use client'
//Component.client.tsx
import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'
import { Hotel, Media } from '@/payload-types'
import Image from 'next/image'

interface HotelServicingClientProps {
  heading?: string
  headingTextColor?: string
  subheading?: string
  subheadingTextColor?: string
  hotels?: Hotel[]
}

const HotelServicingClient: React.FC<HotelServicingClientProps> = ({
  heading,
  headingTextColor = 'text-black',
  subheading,
  subheadingTextColor = 'text-gray',
  hotels = [],
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const [hoveredHotel, setHoveredHotel] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Auto-rotation every 4 seconds
  useEffect(() => {
    if (isPaused || hotels.length <= 4) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const totalSlides = Math.ceil(hotels.length / 4)
        return (prev + 1) % totalSlides
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused, hotels.length])

  if (hotels.length === 0) {
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

  // Get current 4 hotels to display
  const getCurrentHotels = () => {
    if (hotels.length <= 4) {
      return hotels
    }

    const startIndex = currentSlide * 4
    let currentHotels = hotels.slice(startIndex, startIndex + 4)

    // If we don't have 4 hotels, wrap around to the beginning
    if (currentHotels.length < 4) {
      const remainingNeeded = 4 - currentHotels.length
      currentHotels = [...currentHotels, ...hotels.slice(0, remainingNeeded)]
    }

    return currentHotels
  }

  const currentHotels = getCurrentHotels()
  const totalSlides = Math.ceil(hotels.length / 4)

  return (
    <div
      className={cn('w-full py-2 bg-white hotel-servicing-block flex items-center justify-center')}
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
              {/* Display current 4 hotels */}
              {currentHotels.map((hotel, idx) => {
                const hotelId = `${currentSlide}-${idx}-${hotel.id || idx}`
                const url = getLogoUrl(hotel.images)

                const content = (
                  <div
                    key={hotelId}
                    className="relative flex-shrink-0 h-20 w-36 flex items-center justify-center bg-white transition-all duration-300 group"
                    onMouseEnter={() => setHoveredHotel(hotelId)}
                    onMouseLeave={() => setHoveredHotel(null)}
                  >
                    {url ? (
                      <>
                        <Image
                          src={url}
                          alt={hotel.name || 'Hotel Logo'}
                          width={200}
                          height={100}
                          className="transition-opacity duration-300 group-hover:opacity-70"
                          style={{
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%',
                          }}
                          onClick={() => {
                            console.log('hotel', url)
                          }}
                        />
                        {/* Hotel name overlay on hover */}
                        {hoveredHotel === hotelId && hotel.name && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm font-medium px-2 text-center transition-all duration-300">
                            {hotel.name}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )

                // For hotels, we might not have website links like partners, so just return the content
                return content
              })}
            </div>

            {/* Navigation arrows */}
            {hotels.length > 4 && (
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

export default HotelServicingClient
