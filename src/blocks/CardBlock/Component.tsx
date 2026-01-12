'use client'
import React from 'react'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import type { Page } from '@/payload-types'
import { parseHighlightedText } from '@/utilities/textFormatting'
import { Media } from '@/components/Media'

// Get the cardBlock type from the Page layout
type CardBlockType = Extract<Page['layout'][0], { blockType: 'cardBlock' }>

export const CardComponent: React.FC<CardBlockType & { disableInnerContainer?: boolean }> = (
  props,
) => {
  const {
    title,
    subtitle,
    primaryText,
    primaryTextColor,
    secondaryText,
    secondaryTextColor,
    media,
    button,
    backgroundColor = 'bg-white',
    titleColor = 'text-mustard',
    imagePosition = 'left',
  } = props

  // Info card renderer
  const renderInfoCard = () => {
    return (
      <div
        className={cn(
          'card card--info md:p-6 p-2 md:max-w-[420px] md:rounded-tl-lg md:rounded-br-lg md:shadow-2xl',
          backgroundColor,
        )}
      >
        {/* Title and Subtitle Section - Centered */}
        <div className="text-center mb-4">
          <h2 className={cn('card__title text-xl font-bold mb-0', titleColor)}>{title}</h2>
          {subtitle && (
            <h3 className="card__subtitle text-lg font-bold text-mild-gray italic">{subtitle}</h3>
          )}
        </div>

        {/* Image and Primary Text Section */}
        {primaryText ? (
          <div
            className={`flex flex-col lg:flex-row items-center gap-4 mb-0 ${
              imagePosition === 'right' ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Media Section */}
            {media && (
              <div className="flex-1 flex justify-center">
                <div className="w-full max-w-[200px] aspect-[4/3] relative sm:max-w-[140px] md:max-w-[180px] lg:max-w-[200px]">
                  <Media
                    resource={media}
                    size="(max-width: 640px) 140px, (max-width: 768px) 160px, (max-width: 1024px) 180px, 200px"
                    // fill
                    className="rounded-lg object-contain"
                    priority={false}
                    alt={title || 'Card image'}
                  />
                </div>
              </div>
            )}

            {/* Primary Text */}
            {primaryText && (
              <div className="flex-1">
                <p className={cn('card__primary-text text-xl font-roboto', primaryTextColor)}>
                  {primaryText}
                </p>
              </div>
            )}
          </div>
        ) : media ? (
          <div className="flex-1 flex justify-center mb-3">
            <div className="w-full">
              <Media
                resource={media}
                size="(max-width: 640px) 140px, (max-width: 768px) 160px, (max-width: 1024px) 180px, 200px"
                // fill
                className="rounded-lg object-cover"
                priority={false}
                alt={title || 'Card image'}
              />
            </div>
          </div>
        ) : null}

        {/* Secondary Text Section */}
        {secondaryText && (
          <div className={cn('card__secondary-text mt-3 text-xl font-roboto', secondaryTextColor)}>
            {parseHighlightedText(secondaryText)}
          </div>
        )}

        {button && button.text && button.link && (
          <div className="text-center mt-6 pb-1">
            <a href={button.link} className="inline-block">
              <Button
                variant={button.variant || 'mustard'}
                size={button.size || 'default'}
                fullWidth={button.fullWidth || undefined}
              >
                {button.text}
              </Button>
            </a>
          </div>
        )}
      </div>
    )
  }

  // Container layout
  // if (disableInnerContainer) {
  //   return cardType === 'formCard' ? renderFormCard() : renderInfoCard()
  // }

  return (
    <div className="container my-8">
      <div className="grid grid-cols-4 lg:grid-cols-12 gap-8">
        <div className="col-span-4 lg:col-span-12">{renderInfoCard()}</div>
      </div>
    </div>
  )
}

export default CardComponent
