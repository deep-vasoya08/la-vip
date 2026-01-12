// CustomMediaBlock.tsx
'use client'
import { cn } from '@/utilities/ui'
import React from 'react'
import { Media } from '../../components/Media'
import Carousel from '../../components/Carousel'
import MediaGrid from '../../components/MediaGrid'
import { CustomMediaBlockConfig } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const CustomMediaBlock: React.FC<CustomMediaBlockConfig> = ({
  title,
  subtitle,
  mediaItems = [],
  imageSpacing = 0,
  backgroundColor = 'bg-beige',
  viewType,
  itemsPerRow = 'auto',
  buttonText,
  buttonLink,
}) => {
  // State to track view mode (carousel or grid)
  const router = useRouter()
  const isGridView = viewType === 'grid'

  if (!mediaItems.length) return null

  // Transform media items into carousel items
  const carouselItems = mediaItems.map((item, idx) => {
    // Check if the item has a detail page link
    const hasDetailLink = !!(
      item?.d?.link?.url ||
      (item?.d?.link?.reference?.value &&
        typeof item.d.link.reference.value === 'object' &&
        item.d.link.reference.value !== null &&
        'slug' in item.d.link.reference.value)
    )

    return (
      <div
        key={idx}
        className={`${item.isEventItem || hasDetailLink || item.isTourItem ? 'cursor-pointer' : ''} flex flex-col h-full`}
        onClick={() => {
          // Handle event item click
          if (item.isEventItem && item.id) {
            window.open('/events/' + item.id, item.d?.link?.newTab ? '_blank' : '_self')
          } else if (item.isTourItem && item.id) {
            const isBookable = Boolean(
              (item as { d?: { link?: { isBookable?: boolean } } })?.d?.link?.isBookable,
            )
            if (isBookable) {
              window.open('/tours/' + item.id, item.d?.link?.newTab ? '_blank' : '_self')
            } else {
              // Not bookable: go directly to details linked page (URL or referenced slug)
              const referenceValue = item.d?.link?.reference?.value
              const referencePath =
                typeof referenceValue === 'object' &&
                referenceValue !== null &&
                'slug' in referenceValue
                  ? (referenceValue as { slug?: string }).slug || ''
                  : ''

              const targetUrl = item.d?.link?.url || referencePath || ''
              if (targetUrl) {
                if (item.d?.link?.newTab) {
                  window.open(targetUrl, '_blank')
                } else {
                  router.push(targetUrl)
                }
              } else {
                // Fallback to tour details route if no linked page is provided
                router.push('/tours/' + item.id)
              }
            }
          }
          // Handle detail page link click
          else if (hasDetailLink) {
            const referenceValue = item.d?.link?.reference?.value
            const referencePath =
              typeof referenceValue === 'object' &&
              referenceValue !== null &&
              'slug' in referenceValue
                ? referenceValue.slug
                : ''

            const targetUrl = item.d?.link?.url || referencePath || ''
            if (targetUrl) {
              if (item.d?.link?.newTab) {
                window.open(targetUrl, '_blank')
              } else {
                router.push(targetUrl)
              }
            }
          }
        }}
      >
        {/* Fixed height image container for consistent sizing */}
        <div
          className={cn(
            'w-full relative bg-gray-100 flex items-center justify-center overflow-hidden',
            'h-48 md:h-56 lg:h-64',
            item.isTourItem ? 'h-64 md:h-72 lg:h-80' : '',
          )}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Media
              resource={item.media}
              className="w-full h-full"
              imgClassName="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Image overlay text at bottom */}
          {item.overlayText && (
            <div
              className={cn(
                'absolute bottom-0 left-0 w-full p-2',
                item.bgColor || 'bg-black/60',
                item.textColor || 'text-white',
                'break-words overflow-hidden',
              )}
            >
              <div className="line-clamp-3 text-wrap overflow-ellipsis font-roboto font-bold text-sm text-center">
                {item.overlayText}
              </div>
            </div>
          )}
        </div>

        {/* Content container with consistent spacing */}
        <div className="flex-1 flex flex-col justify-start mt-3">
          {/* Caption or team member info below image */}
          {item.isTeamMember ? (
            <div className="text-center">
              {item.name && (
                <p className="text-sm font-bold text-mustard leading-tight">{item.name}</p>
              )}
              {item.position && (
                <p className="text-xs italic font-semibold text-black mt-1 leading-tight">
                  {item.position}
                </p>
              )}
            </div>
          ) : item.isEventItem ? (
            <div className="text-center">
              {item.eventTitle && (
                <p className="text-sm font-bold text-mustard mb-2 text-wrap leading-tight">
                  {item.eventTitle}
                </p>
              )}
              {item.eventDate && (
                <p className="text-sm font-semibold text-black mb-2 text-wrap leading-tight">
                  {item.eventDate}
                </p>
              )}
              {item.eventPlace && (
                <p className="text-sm font-bold text-mustard mb-2 text-wrap leading-tight">
                  {item.eventPlace}
                </p>
              )}
            </div>
          ) : (
            item.caption && (
              <div className="text-black w-full text-center break-words whitespace-normal text-sm leading-tight">
                {item.caption}
              </div>
            )
          )}
        </div>
      </div>
    )
  })

  // Apply image spacing to carousel items
  const itemClassName = imageSpacing
    ? { paddingLeft: imageSpacing || 0 + 'px', paddingRight: imageSpacing || 0 + 'px' }
    : {}

  return (
    <div className={cn('w-full', 'py-4', backgroundColor || 'bg-beige ')}>
      {title && (
        <h2 className="text-2xl font-bold text-center mb-2 font-semplicita text-mustard uppercase">
          {title}
        </h2>
      )}
      {subtitle && (
        <h3 className="text-xl font-semibold italic text-center mb-2 font-semplicita text-gray max-w-4xl mx-auto">
          {subtitle}
        </h3>
      )}
      {/* Render either Carousel or Grid based on state */}
      {isGridView ? (
        <MediaGrid
          items={carouselItems}
          backgroundColor={backgroundColor || 'bg-beige'}
          itemsPerRow={itemsPerRow}
          imageSpacing={imageSpacing || 0}
        />
      ) : (
        <Carousel
          items={carouselItems}
          backgroundColor={backgroundColor || 'bg-beige'}
          options={{
            slidesToShow: 5,
            loop: false,
            align: 'start',
            slidesToScroll: 1,
          }}
          itemsPerRow={itemsPerRow}
          itemClassName={itemClassName}
          showNavigation={mediaItems.length > 1}
          showDots={false}
        />
      )}
      {buttonText && buttonLink && (
        <div className="flex justify-center w-full items-center">
          <Button
            variant="mustard"
            className="w-full md:w-auto mx-auto"
            onClick={() => {
              // Check if reference.value is an object with a slug property
              const referenceValue = buttonLink?.link?.reference?.value
              const referencePath =
                typeof referenceValue === 'object' &&
                referenceValue !== null &&
                'slug' in referenceValue
                  ? referenceValue.slug
                  : ''

              // console.log(buttonLink?.link?.url || referencePath);
              window.open(
                buttonLink?.link?.url || referencePath || '',
                buttonLink?.link?.newTab ? '_blank' : '_self',
              )
            }}
          >
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CustomMediaBlock
