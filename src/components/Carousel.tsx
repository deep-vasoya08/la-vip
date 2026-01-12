'use client'

import { cn } from '@/utilities/ui'
import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

export interface CarouselProps {
  items: React.ReactNode[]
  options?: {
    slidesToShow?: number
    loop?: boolean
    align?: 'start' | 'center' | 'end'
    slidesToScroll?: number
    // navigation?: {
    //   left?: string
    //   right?: string
    // }
    [key: string]: any
  }
  className?: string
  itemClassName?: object
  showNavigation?: boolean
  showDots?: boolean
  backgroundColor?: string
  renderItem?: (item: React.ReactNode, index: number) => React.ReactNode
  itemsPerRow?: string
}

const Carousel: React.FC<CarouselProps> = ({
  items = [],
  options = {},
  itemsPerRow = 'auto',
  className = '',
  itemClassName = {},
  showNavigation = true,
  showDots = false,
  backgroundColor = 'bg-beige',
  renderItem,
}) => {
  // Responsive settings
  const getOptionsForBreakpoint = () => {
    if (typeof window === 'undefined') return { slidesToShow: 3 }
    if (window.innerWidth < 640) return { slidesToShow: 1 }
    if (window.innerWidth < 1024) return { slidesToShow: 2 }
    return { slidesToShow: 3 }
  }

  const [carouselOptions, setCarouselOptions] = useState({
    slidesToShow: 3,
    ...options,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    ...carouselOptions,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)

    const handleResize = () => {
      const newOptions = {
        ...options,
        ...getOptionsForBreakpoint(),
      }
      setCarouselOptions(newOptions)
      emblaApi.reInit()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      emblaApi.off('select', onSelect)
      window.removeEventListener('resize', handleResize)
    }
  }, [emblaApi, onSelect, options])

  if (!items.length) return null

  return (
    <div className={cn('w-full py-6 sm:py-10 relative', backgroundColor, className)}>
      <div className="w-full max-w-[100vw] mx-auto relative px-1 sm:px-0">
        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex-[0_0_100%] min-w-0', // Mobile (default)
                  'sm:flex-[0_0_50%]', // Small screens
                  {
                    // Medium screens
                    'md:flex-[0_0_33.333%]': itemsPerRow === 'auto' || itemsPerRow === '3',
                    'md:flex-[0_0_50%]': itemsPerRow === '2',
                    'md:flex-[0_0_25%]': itemsPerRow === '4',
                    'md:flex-[0_0_100%]': itemsPerRow === '1',

                    // Large screens
                    'lg:flex-[0_0_25%]': itemsPerRow === 'auto' || itemsPerRow === '4',
                    'lg:flex-[0_0_33.333%]': itemsPerRow === '3',
                    'lg:flex-[0_0_50%]': itemsPerRow === '2',
                    'lg:flex-[0_0_100%]': itemsPerRow === '1',

                    // Extra large screens
                    'xl:flex-[0_0_20%]': itemsPerRow === 'auto',
                    'xl:flex-[0_0_25%]': itemsPerRow === '4',
                    'xl:flex-[0_0_33.333%]': itemsPerRow === '3',
                    'xl:flex-[0_0_50%]': itemsPerRow === '2',
                    'xl:flex-[0_0_100%]': itemsPerRow === '1',

                    // 2XL screens
                    '2xl:flex-[0_0_16.666%]': itemsPerRow === 'auto',
                    '2xl:flex-[0_0_100%]': itemsPerRow === '1',
                  },
                )}
              >
                <div style={itemClassName}>{renderItem ? renderItem(item, idx) : item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {showNavigation && items.length > 1 && (
          <>
            <button
              className={cn(
                'absolute top-1/2 -translate-y-1/2 z-10',
                'left-0 sm:left-2 -translate-x-1',
                'bg-mustard text-white rounded-full',
                'p-1 sm:p-2',
                'flex items-center justify-center transition-all duration-300 hover:scale-110',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                selectedIndex === 0 && 'opacity-40 cursor-not-allowed',
              )}
              onClick={() => scrollTo(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              aria-label="Previous slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              className={cn(
                'absolute top-1/2 -translate-y-1/2 z-10',
                'right-0 sm:right-2 translate-x-1',
                'bg-mustard text-white rounded-full',
                'p-1 sm:p-2',
                'flex items-center justify-center transition-all duration-300 hover:scale-110',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                selectedIndex >= scrollSnaps.length - 1 && 'opacity-40 cursor-not-allowed',
              )}
              onClick={() => scrollTo(selectedIndex + 1)}
              disabled={selectedIndex >= scrollSnaps.length - 1}
              aria-label="Next slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {showDots && scrollSnaps.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300',
                  idx === selectedIndex ? 'bg-black scale-110' : 'bg-gray-300 hover:bg-gray-400',
                )}
                onClick={() => scrollTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Carousel
