import React from 'react'
import type { Page } from '@/payload-types'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import Image from 'next/image'
import CardComponent from '@/blocks/CardBlock/Component'
import RichText from '@/components/RichText'

export const SplitHeroWithCTA: React.FC<Page['hero']> = ({ media, splitHero }) => {
  if (!splitHero || !media) return null

  const {
    heading,
    mainTitle,
    mainSubtitle,
    mainDescription,
    contentType = 'card',
    contentPosition = 'left',
    contentImage,
    useCardBlock = true,
    cardBlock = [],
  } = splitHero || {}

  // Determine content order based on position
  const isContentLeft = contentPosition === 'left'

  return (
    <div className="relative bg-white">
      {/* Main Hero Image with Gradient Overlay */}
      <div className="relative min-h-[30vh] md:min-h-[50vh]">
        {media && typeof media === 'object' && (
          <Media fill priority imgClassName="object-cover" resource={media} />
        )}

        {/* Blurry White Overlay - This creates the foggy effect */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"
          aria-hidden="true"
        />

        {/* Additional subtle blur gradient for more depth */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 backdrop-blur-sm opacity-60 bg-gradient-to-t from-white/90 to-transparent"
          style={{ mixBlendMode: 'overlay' }}
          aria-hidden="true"
        />
      </div>

      {/* Content Layout */}
      <div
        className={`container px-4 relative z-10 -mt-24 md:-mt-36 ${contentType === 'none' ? 'pb-2' : 'pb-8'}`}
      >
        {contentType === 'none' ? (
          <div className="max-w-[80%] w-full px-4 mt-24 md:mt-36 text-center justify-center items-center mx-auto">
            {heading && (
              <h5 className="font-semplicita text-xl md:text-2xl mb-3 text-gray tracking-[3.5px] uppercase">
                {heading}
              </h5>
            )}
            {mainTitle && (
              <h1 className="text-3xl md:text-4xl font-bold text-mustard mb-2 uppercase">
                {mainTitle}
              </h1>
            )}

            {mainSubtitle && (
              <h3 className="text-xl md:text-2xl font-semibold text-gray italic">{mainSubtitle}</h3>
            )}

            {mainDescription && (
              <div className="prose max-w-none font-roboto text-black">
                <RichText
                  className="not-prose text-base md:text-xl font-roboto text-black"
                  data={mainDescription}
                  enableGutter={false}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn('flex flex-col md:flex-row px-2 sm:px-4 md:px-8 xl:px-10', {
              'md:flex-row-reverse': !isContentLeft,
            })}
          >
            {/* Main Content - Appears first on mobile */}
            <div className="md:w-1/2 lg:w-7/12 md:px-4 mt-8 self-center order-1 md:order-2">
              {heading && (
                <h5 className="font-semplicita text-xl md:text-2xl mb-3 text-gray tracking-[3.5px] uppercase">
                  {heading}
                </h5>
              )}
              {mainTitle && (
                <h1 className="text-4xl md:text-4xl font-bold text-mustard mb-2 uppercase">
                  {mainTitle}
                </h1>
              )}

              {mainSubtitle && (
                <p className="text-xl md:text-2xl font-semibold text-mild-gray mb-2 italic">
                  {mainSubtitle}
                </p>
              )}

              {mainDescription && (
                <div className="prose max-w-none font-roboto text-black">
                  <RichText
                    className="not-prose text-base md:text-xl font-roboto text-black"
                    data={mainDescription}
                    enableGutter={false}
                  />
                </div>
              )}
            </div>

            {/* Card or Image - Appears second on mobile */}
            <div className="md:w-1/2 lg:w-5/12 md:px-4 px-2 order-2 md:order-1 mt-8 md:mt-0">
              {contentType === 'card' ? (
                useCardBlock && cardBlock && cardBlock.length > 0 ? (
                  // Using integrated CardBlock component
                  <div className="md:p-0 p-0">
                    <CardComponent
                      title={cardBlock[0]?.title || ''}
                      subtitle={cardBlock[0]?.subtitle || ''}
                      primaryText={cardBlock[0]?.primaryText || ''}
                      primaryTextColor={cardBlock[0]?.primaryTextColor || 'text-black'}
                      secondaryText={cardBlock[0]?.secondaryText || ''}
                      secondaryTextColor={cardBlock[0]?.secondaryTextColor || 'text-black'}
                      disableInnerContainer
                      {...cardBlock[0]}
                      // cardType="infoCard"
                      blockType="cardBlock"
                    />
                  </div>
                ) : null
              ) : (
                // Display image instead of card
                contentImage && (
                  <div className="max-w-md mx-auto md:mx-0 bg-transparent">
                    {typeof contentImage === 'object' ? (
                      <Media
                        resource={contentImage}
                        imgClassName="w-full h-auto mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-80 relative bg-transparent">
                        <Image
                          src={`/media/${contentImage}`}
                          alt="Hero content image"
                          fill
                          className="object-contain mix-blend-multiply"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SplitHeroWithCTA
