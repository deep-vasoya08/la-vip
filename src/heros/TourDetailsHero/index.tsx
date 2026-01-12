'use client'

import React from 'react'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import TourBookingPayment from '@/components/TourBookingPayment'
import { TourOption } from '@/components/TourBookingPayment/types'

type TourDetailsHeroProps = {
  tourName: string
  shortDescription?: string | null
  description?: any
  tourAvatarImage?: any
  toursData: TourOption[]
  selectedTourId: number
  tourDetailsPageHeroImage?: any
}

const TourDetailsHero: React.FC<TourDetailsHeroProps> = ({
  tourName,
  shortDescription,
  description,
  tourAvatarImage,
  tourDetailsPageHeroImage,
  toursData,
  selectedTourId,
}) => {
  return (
    <div className="relative bg-white">
      {/* Main Hero Image with Gradient Overlay */}
      <div className="relative min-h-[40vh] md:min-h-[55vh]">
        {tourDetailsPageHeroImage && typeof tourDetailsPageHeroImage === 'object' && (
          <Media
            fill
            priority
            imgClassName="object-cover"
            resource={tourDetailsPageHeroImage ?? tourAvatarImage}
          />
        )}

        {/* Blurry White Overlay - This creates the foggy effect */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"
          aria-hidden="true"
        />

        {/* Additional subtle blur gradient for more depth */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32  opacity-60 bg-gradient-to-t from-white/90 to-transparent"
          style={{ mixBlendMode: 'overlay', backdropFilter: 'blur(1px)' }}
          aria-hidden="true"
        />
      </div>

      {/* Content Layout */}
      <div className={`container px-4 relative z-10 -mt-36 md:-mt-42 pb-2`}>
        <div
          className={cn('flex flex-col md:flex-row px-2 sm:px-4 md:px-8 xl:px-10 pt-14 md:pt-0', {
            'md:flex-row-reverse': true,
          })}
        >
          {/* Main Content - Appears first on mobile */}
          <div className="md:w-1/2 lg:w-7/12 md:px-4 mt-8 self-center order-1 md:order-2">
            {tourName && (
              <h2 className="font-bold font-semplicita mb-1 text-mustard uppercase">{tourName}</h2>
            )}
            {shortDescription && (
              <h5 className="font-semibold italic font-semplicita mb-3 text-gray">
                {shortDescription}
              </h5>
            )}
            {description && (
              <div className="prose max-w-none ">
                <RichText
                  data={description}
                  className="px-0 text-black text-xl font-roboto"
                  enableProse={false}
                />
              </div>
            )}
          </div>

          {/* Card or Image - Appears second on mobile */}
          <div className="md:w-1/2 lg:w-5/12 md:px-4 px-2 order-2 md:order-1 mt-8 md:mt-0">
            <TourBookingPayment tours={toursData} className="" selectedTourId={selectedTourId} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TourDetailsHero
