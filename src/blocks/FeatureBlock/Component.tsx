'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { FeatureBlockConfig } from '@/payload-types'
import Image from 'next/image'

export const FeatureBlock: React.FC<FeatureBlockConfig> = ({
  features = [],
  backgroundColor = 'bg-beige',
}) => {
  const bgColorClass = backgroundColor

  return (
    <section className={`${bgColorClass}`}>
      <div className="mx-auto">
        {features?.map((feature, index) => {
          const {
            heading,
            // headingTextColor = 'text-gray',
            subheading,
            // subheadingTextColor = 'text-gray',
            image,
            imagePosition = 'right',
            hasButton,
            button,
          } = feature

          const isEven = index % 2 === 0
          // Alternate image position if not explicitly set
          const finalImagePosition = imagePosition || (isEven ? 'right' : 'left')
          const finalIsImageRight = finalImagePosition === 'right'

          return (
            <div
              key={`feature-${index}`}
              className={`flex flex-col ${finalIsImageRight ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-0`}
            >
              {/* Image */}
              <div className="w-full lg:w-1/2 h-full">
                {image && (
                  <div className="h-full">
                    <Image
                      src={
                        typeof image === 'string'
                          ? image
                          : typeof image === 'object' &&
                              image !== null &&
                              'url' in image &&
                              image.url
                            ? image.url
                            : ''
                      }
                      alt={heading || 'Feature image'}
                      className="w-full h-full object-cover"
                      width={800}
                      height={600}
                      priority={index === 0}
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="w-full lg:w-1/2 flex justify-center items-center">
                <div className="w-full lg:w-[75%] space-y-6 px-4 py-8">
                  {heading && (
                    <h2
                      className={`text-2xl md:text-3xl font-bold font-roboto text-mustard uppercase `}
                    >
                      {heading}
                    </h2>
                  )}

                  {subheading && (
                    <p className={`text-lg md:text-xl font-roboto font-semibold text-gray italic`}>
                      {subheading}
                    </p>
                  )}

                  {hasButton && button?.text && (
                    <div className="flex justify-start w-full items-start self-start">
                      <Button
                        variant="mustard"
                        className="w-full md:w-auto items-start self-start"
                        onClick={() => {
                          if (button?.link) {
                            window.open(button.link, button.newTab ? '_blank' : '_self')
                          }
                        }}
                      >
                        {button?.text}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FeatureBlock
