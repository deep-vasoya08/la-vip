'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import type { Fleet, FleetListConfig } from '@/payload-types'
import { CMSLink } from '@/components/Link'
// Helper function to determine if a value is a Media object
const isMedia = (value: any): value is { url: string; alt?: string } => {
  return typeof value === 'object' && value !== null && 'url' in value
}

// Helper function to determine if a value is a Fleet object and not a number
const isFleet = (value: any): value is Fleet => {
  return typeof value === 'object' && value !== null && 'vehicleName' in value
}

// We're creating a separate type for the client component that makes fleets required but selectedFleets optional
type FleetListClientProps = Omit<FleetListConfig, 'selectedFleets'> & {
  fleets: (number | Fleet)[]
  selectedFleets?: FleetListConfig['selectedFleets']
}

export const FleetListClient: React.FC<FleetListClientProps> = ({
  title,
  description,
  fleets,
  ctaText,
  ctaUrl,
  backgroundColor,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  // console.log(fleets)

  const handlePrevious = () => {
    const length = fleets?.length || 0
    setCurrentIndex((prev) => (prev === 0 ? length - 1 : prev - 1))
  }

  const handleNext = () => {
    const length = fleets?.length || 0
    setCurrentIndex((prev) => (prev === length - 1 ? 0 : prev + 1))
  }

  return (
    <div className={cn('w-full', backgroundColor || 'bg-white')}>
      <div className="container px-2 sm:px-6 md:px-4 lg:px-0 py-2 sm:py-6 md:py-8 xl:py-10">
        {/* Title and Description - Shown in both views */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-mustard uppercase">{title}</h2>
          <p className="text-xl font-semibold italic font-roboto md:text-base text-gray max-w-4xl m-auto">
            {description}
          </p>
        </div>

        {/* Desktop View - Vehicle Grid with Horizontal Scroll (hidden scrollbar) */}
        <div className="hidden md:block overflow-x-auto scrollbar-hide pb-4 mb-2">
          <div className="flex gap-8 min-w-max justify-around">
            {fleets?.map((fleet, index) => (
              <CMSLink
                key={index}
                type={isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.type : undefined}
                url={isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.url : undefined}
                newTab={isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.newTab : undefined}
                reference={
                  isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.reference : undefined
                }
                appearance="inline"
                className=""
              >
                <div className="flex flex-col items-center w-[200px] transition-transform duration-300 hover:scale-110">
                  {isFleet(fleet) && fleet.image && isMedia(fleet.image) ? (
                    <div className="relative w-[264px] h-[168px] mb-4">
                      <Image
                        src={fleet?.image?.url}
                        alt={fleet?.vehicleName || `Vehicle ${index + 1}`}
                        fill
                        priority={index === 0}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-[216px] h-[168px] mb-4 bg-gray-200"></div>
                  )}
                  <span className="text-sm font-bold text-mustard text-center">
                    {isFleet(fleet) ? fleet.vehicleName : ''}
                  </span>
                </div>
              </CMSLink>
            ))}
          </div>
        </div>

        {/* Mobile View - Vehicle Carousel */}
        {fleets && fleets.length > 0 && (
          <div className="md:hidden">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white p-4 w-full relative">
                {/* Left Arrow */}
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-mustard hover:bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center z-10 transition-all duration-300 hover:scale-110"
                  aria-label="Previous vehicle"
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

                {/* Vehicle Image with Fade Animation */}
                <div className="relative w-full h-56 sm:h-48 mb-4 overflow-hidden">
                  {fleets?.map((fleet, index) =>
                    isFleet(fleet) && fleet.image && isMedia(fleet.image) ? (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-500 ${
                          index === currentIndex
                            ? 'opacity-100 transform scale-100'
                            : 'opacity-0 transform scale-95 pointer-events-none'
                        }`}
                      >
                        <CMSLink
                          type={
                            isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.type : undefined
                          }
                          url={isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.url : undefined}
                          newTab={
                            isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.newTab : undefined
                          }
                          reference={
                            isFleet(fleet)
                              ? fleet?.fleetDetailsPageLink?.link?.reference
                              : undefined
                          }
                          appearance="inline"
                          className="block w-full h-full"
                        >
                          <Image
                            src={fleet?.image?.url}
                            alt={fleet?.vehicleName || 'Vehicle'}
                            fill
                            priority
                            className="object-contain"
                          />
                        </CMSLink>
                      </div>
                    ) : null,
                  )}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-mustard hover:bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center z-10 transition-all duration-300 hover:scale-110"
                  aria-label="Next vehicle"
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

                {/* Vehicle Name with Animation */}
                <div className="text-center">
                  <div className="h-8 mb-2 overflow-hidden relative">
                    {fleets?.map((fleet, index) => (
                      <h3
                        key={index}
                        className={`text-mustard text-lg font-bold absolute w-full transition-all duration-500 ${
                          index === currentIndex
                            ? 'opacity-100 transform translate-y-0'
                            : 'opacity-0 transform translate-y-4'
                        }`}
                      >
                        <CMSLink
                          type={
                            isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.type : undefined
                          }
                          url={isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.url : undefined}
                          newTab={
                            isFleet(fleet) ? fleet?.fleetDetailsPageLink?.link?.newTab : undefined
                          }
                          reference={
                            isFleet(fleet)
                              ? fleet?.fleetDetailsPageLink?.link?.reference
                              : undefined
                          }
                          appearance="inline"
                          className="text-mustard no-underline hover:underline"
                        >
                          {isFleet(fleet) ? fleet.vehicleName : ''}
                        </CMSLink>
                      </h3>
                    ))}
                  </div>
                  {ctaUrl ? (
                    <a href={ctaUrl} className="w-full block">
                      <Button
                        variant="mustard"
                        className="w-full transition-all duration-300 hover:shadow-lg"
                      >
                        {ctaText || 'Book a Charter'}
                      </Button>
                    </a>
                  ) : (
                    <div className="h-10"></div> /* Spacer when no CTA */
                  )}
                </div>

                {/* Pagination Dots */}
                {/* <div className="flex justify-center mt-4 gap-2">
                  {vehicles.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                        index === currentIndex ? 'w-6 bg-mustard' : 'w-2 bg-gray-300'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
