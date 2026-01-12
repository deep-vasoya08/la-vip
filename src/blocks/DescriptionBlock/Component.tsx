// DescriptionBlock.tsx
'use client'

import * as React from 'react'
import { DescriptionBlockConfig } from '@/payload-types'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { parseParagraphsWithHighlight } from '@/utilities/textFormatting'

export const DescriptionBlock: React.FC<DescriptionBlockConfig> = ({
  blockTitle,
  heading,
  headingTextColor,
  subheading,
  subheadingTextColor,
  quoteText,
  quoteTextColor,
  showQuote,
  hasButton,
  button,
  backgroundColor,
}) => {
  return (
    <div
      className={cn(
        'w-full py-10 px-4 sm:px-8 md:px-12 lg:px-20',
        backgroundColor === 'beige' ? 'bg-beige' : 'bg-white',
        'description-block',
      )}
    >
      <div className="max-w-4xl mx-auto text-center">
        {blockTitle && (
          <h5 className="font-semplicita text-xl md:text-2xl mb-5 text-gray tracking-[3.5px] uppercase">
            {blockTitle}
          </h5>
        )}
        {heading && (
          <div className="max-w-4xl m-auto">
            <h2 className={cn('text-2xl md:text-3xl font-bold mb-2 uppercase', headingTextColor)}>
              {heading}
            </h2>
          </div>
        )}
        {subheading && (
          <div className="max-w-4xl m-auto">
            <h3 className={cn('text-xl md:text-xl italic mb-6', subheadingTextColor)}>
              {subheading}
            </h3>
          </div>
        )}
        {quoteText && (
          <div className={cn(`italic mb-6 relative max-w-4xl mx-auto`, quoteTextColor)}>
            {showQuote && (
              <div className={`absolute left-0 -top-20 md:-top-24 ${subheading ? '' : 'mt-3'}`}>
                <Image
                  src="/images/Quote.png"
                  alt="Quote Mark"
                  width={90}
                  height={90}
                  className="text-amber-500"
                  priority
                />
              </div>
            )}
            <span className="block px-4 text-base font-roboto font-normal not-italic text-black text-left">
              {parseParagraphsWithHighlight(quoteText)}
            </span>
          </div>
        )}
        {hasButton && button?.text && (
          <div className="mt-6 flex justify-center">
            <Link href={button.link || '#'}>
              <Button variant="mustard" size="small">
                {button.text}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default DescriptionBlock
