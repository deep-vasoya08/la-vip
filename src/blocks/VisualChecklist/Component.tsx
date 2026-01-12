'use client'
import { Media, VisualChecklistBlock as VisualChecklistBlockProp } from '@/payload-types'
import { cn } from '@/utilities/ui'
import Image from 'next/image'
import React from 'react'
import { Button } from '@/components/ui/button'

const getImageUrl = (media: Media | number): string => {
  if (!media) return ''
  if (typeof media === 'string') return media
  if (typeof media === 'number') return `/api/media/${media}`
  if (media.url) return media.url
  if (media.filename) return `/media/${media.filename}`
  return ''
}

const VisualChecklist: React.FC<VisualChecklistBlockProp> = ({
  heading,
  items,
  image,
  textColor = 'text-gray',
  hasButton,
  button,
  isImageAbsolute,
  isImageVisibleForMobile = true,
}) => {
  return (
    <div className="bg-white relative">
      <div className="relative z-10">
        {isImageAbsolute && image && isImageVisibleForMobile && (
          <div className="lg:hidden block w-full flex items-center justify-center mb-3 z-20">
            <Image
              src={getImageUrl(image)}
              alt="Service vehicle"
              width={500}
              height={200}
              className="max-w-[280px] w-full h-auto"
            />
          </div>
        )}
        <div
          className={`${isImageAbsolute ? 'flex flex-col lg:flex-row w-auto' : 'flex flex-col lg:flex-row md:items-center md:justify-between'}`}
        >
          {image && (
            <div
              className={cn(
                isImageAbsolute
                  ? 'hidden lg:block w-1/2 h-auto'
                  : isImageVisibleForMobile
                    ? 'w-full h-auto lg:w-1/2 mb-8 lg:mb-0 flex items-center justify-start'
                    : 'hidden lg:flex w-full h-auto lg:w-1/2 mb-8 lg:mb-0 items-center justify-start',
              )}
            >
              <Image
                src={getImageUrl(image)}
                alt="Service vehicle"
                width={500}
                height={200}
                className={cn(
                  isImageAbsolute
                    ? 'max-w-[280px] absolute bottom-0 left-[calc(100vw-94%)]'
                    : 'object-cover w-full h-auto',
                )}
              />
            </div>
          )}
          <div
            className={`flex flex-col py-12 w-full ${image ? 'lg:w-1/2' : 'w-full'} justify-center ${isImageAbsolute ? 'items-start ' : 'items-center'}`}
          >
            <div className={`w-full ${image ? 'max-w-2xl' : 'max-w-3xl'} px-4 md:px-8`}>
              <h2
                className={cn('text-2xl font-semplicita font-semibold mb-6 uppercase', textColor)}
              >
                {heading}
              </h2>
              <div className={`space-y-3 mb-4 ${image ? 'lg:mb-0' : 'mb-8'}`}>
                {items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.icon && (
                        <Image
                          src={getImageUrl(item.icon)}
                          alt=""
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-base text-left font-semplicita font-semibold',
                        item.itemTextColor,
                      )}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}

                {hasButton && button?.text && (
                  <div className="flex justify-center w-full items-center self-center mt-4">
                    <Button
                      variant="mustard"
                      className="w-full md:w-auto items-center self-center"
                      onClick={() => {
                        if (button?.link) {
                          window.open(button.link, '_self')
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
        </div>
      </div>
    </div>
  )
}

export default VisualChecklist
