'use client'
import React, { useState } from 'react'
import { cn } from '@/utilities/ui'
import type { Page } from '@/payload-types'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { parseTextWithFormatting } from '@/utilities/textFormatting'

// Get the faqBlock type from the Page layout
type FAQBlockType = Extract<Page['layout'][0], { blockType: 'faqBlock' }>

export const FAQComponent: React.FC<FAQBlockType & { disableInnerContainer?: boolean }> = (
  props,
) => {
  const {
    title,
    backgroundStyle = 'cream',
    sideImage,
    imagePosition = 'left',
    faqs = [],
    disableInnerContainer,
  } = props

  // State to track which FAQs are open
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>(
    (faqs || []).reduce(
      (acc: Record<number, boolean>, faq, index) => {
        acc[index] = faq.isOpen || false
        return acc
      },
      {} as Record<number, boolean>,
    ),
  )

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const renderFAQContent = () => (
    <div
      className={cn('py-0 px-4 md:px-6 lg:px-8', {
        'bg-white': backgroundStyle === 'light',
        'bg-cream': backgroundStyle === 'cream',
      })}
    >
      {/* Title - left-aligned on mobile, centered on larger screens */}
      <h2 className="text-2xl text-mild-gray font-bold pt-8 mb-8 text-left md:text-center uppercase">
        {title}
      </h2>

      {/* Content section with image and FAQs */}
      <div
        className={cn('flex flex-col md:flex-row gap-8', {
          'md:flex-row-reverse': imagePosition === 'right',
        })}
      >
        {/* Side Image - hidden on mobile, positioned at bottom */}
        {sideImage && (
          <div className="hidden md:flex w-full md:w-1/3 justify-center self-end">
            <div className="w-[30rem] h-[30rem] relative">
              <Image
                src={
                  typeof sideImage === 'object' && sideImage !== null
                    ? sideImage.url || ''
                    : sideImage
                      ? `/media/${sideImage}`
                      : ''
                }
                alt="FAQ Representative"
                className="rounded-lg object-contain mix-blend-multiply"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
        )}

        {/* FAQs Content */}
        <div className={cn('flex-1', { 'w-full': !sideImage })}>
          {/* FAQ Items */}
          <div className="">
            {faqs?.map((faq, index) => (
              <div key={index || faq.id} className="bg-white p-2 overflow-hidden mb-2">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center py-3 px-2 focus:outline-none text-left hover:bg-gray-50 transition-colors duration-300"
                >
                  <span
                    className={cn('text-lg font-semibold text-mild-gray', {
                      'text-mustard font-bold': openFaqs[index],
                    })}
                  >
                    {faq.question}
                  </span>
                  <span className="text-mustard">
                    {openFaqs[index] ? (
                      <ChevronUp
                        size={36}
                        className="transform transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <ChevronDown
                        size={36}
                        className="transform transition-transform duration-500 ease-out"
                      />
                    )}
                  </span>
                </button>

                <div
                  className={cn('overflow-hidden transition-all origin-top', {
                    'max-h-0 opacity-0 transform scale-y-95 transition-all duration-500 ease-in':
                      !openFaqs[index],
                    'max-h-[2000px] opacity-100 pt-2 pb-4 transform scale-y-100 transition-all duration-500 ease-out':
                      openFaqs[index],
                  })}
                >
                  <div className="text-black pl-2">
                    <div className="mb-4 font-roboto">
                      {faq.answer ? parseTextWithFormatting(faq.answer) : ''}
                    </div>
                    {/* Logos if present */}
                    {faq.logos && faq.logos.length > 0 && (
                      <div className="flex flex-wrap gap-6 items-center justify-start mt-4">
                        {faq.logos.map((logoItem, logoIndex) => (
                          <div key={logoIndex || logoItem.id} className="w-24 h-24 relative">
                            {logoItem.link ? (
                              <a href={logoItem.link} target="_blank" rel="noopener noreferrer">
                                <Image
                                  src={
                                    typeof logoItem.logo === 'object' && logoItem.logo !== null
                                      ? logoItem.logo.url || ''
                                      : logoItem.logo
                                        ? `/media/${logoItem.logo}`
                                        : ''
                                  }
                                  alt={logoItem.name || 'Logo'}
                                  className="object-contain"
                                  fill
                                  sizes="96px"
                                />
                              </a>
                            ) : (
                              <Image
                                src={
                                  typeof logoItem.logo === 'object' && logoItem.logo !== null
                                    ? logoItem.logo.url || ''
                                    : logoItem.logo
                                      ? `/media/${logoItem.logo}`
                                      : ''
                                }
                                alt={logoItem.name || 'Logo'}
                                className="object-contain"
                                fill
                                sizes="96px"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Container layout
  if (disableInnerContainer) {
    return renderFAQContent()
  }

  return <div className="container mx-auto px-4">{renderFAQContent()}</div>
}

export default FAQComponent
