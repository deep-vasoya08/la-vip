// InfoBlock.tsx
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { InfoBlockConfig } from '@/payload-types'
import { parseHighlightedText } from '@/utilities/textFormatting'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const InfoBlock: React.FC<InfoBlockConfig> = ({
  heading,
  headingTextColor,
  subheading,
  subheadingTextColor,
  bodyText,
  quoteText,
  quoteTextColor,
  image,
  showQuote = true,
  imagePosition = 'right',
  caption,
  button,
  hasButton,
  backgroundColor = 'beige',
}: InfoBlockConfig) => {
  // Render the button if it exists
  const renderButton = () => {
    if (!button || !button.text) return null

    return (
      <Link
        href={button.link || '#'}
        // className="inline-block bg-mustard text-white font-semibold uppercase py-3 px-8 rounded-full transition-colors hover:bg-amber-600 mt-4"
      >
        <Button variant="mustard" size="small">
          {button.text}
        </Button>
      </Link>
    )
  }

  return (
    <div className={`w-full py-12 ${backgroundColor === 'beige' ? 'bg-[#FAF8F5]' : 'bg-white'}`}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 `}>
        {heading && (
          <h2
            className={`${headingTextColor} text-2xl md:text-3xl font-semplicita font-semibold  mb-2 text-center uppercase`}
          >
            {heading}
          </h2>
        )}

        {subheading && (
          <div
            className={`${subheadingTextColor} text-xl font-semplicita font-semibold italic text-center ${!bodyText ? 'mb-10' : 'mb-8'}`}
          >
            {subheading}
          </div>
        )}

        {bodyText && (
          <div
            className={`max-w-4xl mx-auto text-base font-roboto font-normal text-black leading-relaxed ${hasButton ? 'mb-8' : 'mb-4'} text-left ${!subheading && 'mt-4'}`}
          >
            <RichText
              className="not-props max-w-4xl mx-auto text-center text-black"
              data={bodyText}
            />
          </div>
        )}
        <div
          className={`flex flex-col md:flex-row items-center ${
            image
              ? imagePosition === 'left'
                ? 'md:flex-row-reverse md:justify-end md:gap-28'
                : 'md:justify-between'
              : 'justify-center'
          } ${caption && 'pb-5'} `}
        >
          {quoteText && (
            <div className="rounded-lg max-w-lg flex flex-col gap-10 items-center p-6 mb-8 md:mb-0">
              <div className="relative">
                {showQuote && (
                  <div className="absolute left-0 -top-[4.2rem]">
                    <Image
                      src="/images/Quote.png"
                      alt="Quote"
                      width={90}
                      height={90}
                      className="text-amber-500"
                      // style={{ width: '50%', height: 'auto' }}
                    />
                  </div>
                )}
                <div
                  className={`${showQuote ? 'pl-16' : ''} text-base ${quoteTextColor} font-roboto max-w-md leading-relaxed italic`}
                >
                  {parseHighlightedText(quoteText)}
                </div>
              </div>
              {renderButton()}
            </div>
          )}
          {!quoteText && hasButton && renderButton()}

          {image && (
            <div className={`w-full max-w-[470px] h-auto md:h-[300px] mt-4 md:mt-0`}>
              <Image
                src={
                  typeof image === 'string'
                    ? image
                    : typeof image === 'object' && image !== null && 'url' in image && image.url
                      ? image.url
                      : ''
                }
                alt={caption || heading || 'Information image'}
                className="w-full h-auto shadow-md"
                width={470}
                height={300}
              />
              {caption && (
                <div className="mt-3 text-sm font-roboto font-normal not-italic text-left text-black ">
                  {caption}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InfoBlock
