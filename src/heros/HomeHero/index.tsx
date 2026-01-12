import React from 'react'
import type { Page } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'

export const HomeHero: React.FC<Page['hero']> = ({
  missionTitle,
  missionText,
  missionImage,
  missionBackgroundColor,
  links,
  title,
  subtitle,
  media,
  richText,
  button,
}) => {
  return (
    <div className="relative bg-white">
      {/* Hero background with fleet image */}
      <div className="relative min-h-[20vh] md:min-h-[60vh] z-0">
        {media && typeof media === 'object' && (
          <Media fill priority imgClassName="object-cover" resource={media} />
        )}
      </div>
      {/* Content below image */}
      <div className="container mx-auto px-4 p-4 mb-0 md:mb-10">
        <div className="flex flex-col md:flex-row justify-end">
          <div className="md:w-[46%] ml-0 md:ml-[20%]">
            <h1 className="text-4xl md:text-3xl lg:text-4xl font-bold mb-0 text-mustard font-semplicita uppercase">
              {title}
            </h1>
            <p className="text-lg mb-0 font-semibold italic text-gray font-semplicita">
              {subtitle}
            </p>
            {richText && (
              <div className="text-black font-roboto">
                <RichText data={richText} enableGutter={false} enableProse={false} />
              </div>
            )}
            <div className="mt-4">
              {button && button.text && button.link && (
                <a href={button.link}>
                  <Button
                    variant={button.variant || 'mustard'}
                    size={button.size || 'default'}
                    fullWidth={button.fullWidth || undefined}
                  >
                    {button.text}
                  </Button>
                </a>
              )}

              {links && links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {links.map((link, i) => {
                    return (
                      <CMSLink
                        key={i}
                        {...link}
                        appearance={i === 0 ? 'default' : 'link'}
                        className="mt-4 md:mt-6"
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="md:w-1/2 flex items-center justify-center">
            <div className="md:hidden h-[250px] md:h-[400px] mt-[0px] md:mt-[-120px]">
              {missionImage && typeof missionImage === 'object' && (
                <img
                  src={missionImage?.url || ''}
                  className="h-[320px] md:inset-auto md:w-[300px] md:h-[250px]"
                  // fill
                  // priority
                  // className="!w-[180px] !h-[270px] !inset-auto"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* our mission script */}
      {(missionTitle || missionText || missionImage) && (
        <div className={`${missionBackgroundColor} py-8 relative`}>
          <div className="container mx-auto px-4 sm:w-full">
            <div className="flex flex-col md:flex-col items-start ml-0 md:ml-[10%] md:w-[60%]">
              <h1 className="text-2xl md:text-3xl font-bold text-mustard font-semplicita mb-4 uppercase">
                {missionTitle}
              </h1>
              <p className="text-base md:text-lg text-black font-roboto">{missionText}</p>
            </div>
          </div>
          <div className="hidden md:block absolute right-[30px] bottom-[0px] w-[400px] h-[250px] md:h-[550px] z-10 overflow-hidden">
            {missionImage && typeof missionImage === 'object' && (
              <Media fill priority imgClassName="object-cover" resource={missionImage} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
