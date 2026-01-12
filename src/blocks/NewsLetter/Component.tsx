'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { NewsletterBlock as NewsLetterProps } from '@/payload-types'

export const Newsletter: React.FC<NewsLetterProps> = ({
  headline,
  buttonText,
  backgroundColor,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not the modal content
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  return (
    <>
      <div className={cn('w-full py-4 sm:py-6 md:py-8', backgroundColor, 'className')}>
        <div className="container px-4 sm:px-8 md:px-7 lg:px-20 flex flex-col md:flex-row items-center justify-between gap-4 ">
          <h5 className="text-white font-semplicita text-base sm:text-lg md:text-xl font-semibold text-center md:text-left mb-3 md:mb-0">
            {headline}
          </h5>
          <Button
            variant={'default'}
            className="whitespace-nowrap w-full md:w-auto"
            onClick={handleButtonClick}
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header with Cancel Button */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className=" text-mustard text-lg font-semibold">Newsletter Signup</h3>
              <button
                onClick={closeModal}
                className="text-red-500 hover:text-red-700 transition-colors p-1"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content - responsive iframe */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Wrapper to keep aspect ratio */}
              <div className="!relative !w-full !min-h-[80vh] !sm:min-h-[30vh]">
                <iframe
                  src="https://cdn.forms-content-1.sg-form.com/4bdb5fa7-72fd-11f0-bff0-267fde403259"
                  className="absolute !top-0 !left-0 !w-full !h-full border-0"
                  title="Newsletter Signup Form"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
