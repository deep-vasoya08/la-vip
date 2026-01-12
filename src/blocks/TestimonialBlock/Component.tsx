// TestimonialBlock.tsx
'use client'

import * as React from 'react'
import { cn } from '@/utilities/ui'
import { parseParagraphsWithHighlight } from '@/utilities/textFormatting'
import { TestimonialBlockConfig } from '@/payload-types'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Carousel from '@/components/Carousel'

export const TestimonialBlock: React.FC<TestimonialBlockConfig> = ({
  heading,
  headingTextColor = 'text-black',
  subheading,
  subheadingTextColor = 'text-gray',
  testimonials = [],
  backgroundColor = 'bg-beige',
  showQuote,
  carouselOptions = {
    itemsPerRow: '1',
    showNavigation: true,
    showDots: false,
  },
  hasButton,
  button,
}) => {
  const renderButton = () => {
    if (!button || !button.text) return null

    return (
      <Link href={button.link || '#'}>
        <Button variant="mustard" size="small">
          {button.text}
        </Button>
      </Link>
    )
  }

  // Define type for testimonial item
  type TestimonialItem = {
    testimonialText: string
    testimonialName?: string | null
    testimonialPlace?: string | null
    testimonialTime?: string | null
    testimonialHeading?: string | null
  }

  // Render a single testimonial
  const renderTestimonial = (testimonial: TestimonialItem) => {
    const {
      testimonialText,
      testimonialName,
      testimonialPlace,
      testimonialTime,
      testimonialHeading,
    } = testimonial

    return (
      <div className="w-full flex flex-col items-center px-0 sm:px-4">
        {testimonialHeading && (
          <h2
            className={cn(
              'text-base md:text-lg mb-4 text-2xl md:text-3xl',
              'text-mustard uppercase font-bold',
            )}
          >
            {testimonialHeading}
          </h2>
        )}
        <div className="w-full sm:w-[80%] relative">
          {showQuote && (
            <div className={`absolute left-0 -top-10`}>
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
          <div className="pl-16 flex flex-col gap-2">
            <div className="flex-row items-baseline gap-2 mb-1">
              {testimonialPlace && (
                <span className="text-xl font-roboto font-semibold text-black">
                  {testimonialPlace}
                </span>
              )}
              {testimonialTime && (
                <span className="italic text-xl text-black font-roboto ml-1">
                  {testimonialTime}
                </span>
              )}
            </div>
            <div className="text-xl italic text-left text-base md:text-lg text-black mb-2 font-roboto">
              {parseParagraphsWithHighlight(testimonialText)}
            </div>
            <div className="text-xl text-left font-roboto text-base font-normal text-black font-roboto">
              {testimonialName && (
                <span className="block italic font-roboto">{testimonialName}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn(
        'w-full px-2 sm:px-2 md:px-4 lg:px-6',
        backgroundColor,
        'testimonial-block',
        heading || subheading ? 'py-12' : 'py-2',
      )}
    >
      <div className="mx-auto flex flex-col items-center">
        {heading && (
          <h2
            className={cn(
              'text-center text-mustard font-bold text-2xl md:text-3xl mb-3 tracking-wide uppercase',
              headingTextColor,
            )}
          >
            {heading}
          </h2>
        )}
        {subheading && (
          <h3 className={cn('text-base md:text-lg mb-4', subheadingTextColor)}>{subheading}</h3>
        )}

        {testimonials && testimonials.length > 0 && (
          <div className="w-full">
            <Carousel
              items={testimonials.map((testimonial) => renderTestimonial(testimonial))}
              backgroundColor={backgroundColor || 'bg-beige'}
              itemsPerRow={'1'}
              showNavigation={carouselOptions?.showNavigation !== false}
              showDots={carouselOptions?.showDots === true}
              options={{
                loop: false,
                align: 'center',
                slidesToScroll: 1,
              }}
            />
          </div>
        )}

        {hasButton && <div className="mt-8 flex justify-center">{renderButton()}</div>}
      </div>
    </section>
  )
}

export default TestimonialBlock
