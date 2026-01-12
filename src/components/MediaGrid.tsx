'use client'
import React from 'react'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'

interface MediaGridProps {
  items: React.ReactNode[]
  backgroundColor?: string
  itemsPerRow?: 'auto' | '2' | '3' | '4' | '1'
  imageSpacing?: number
}

const MediaGrid: React.FC<MediaGridProps> = ({
  items = [],
  backgroundColor = 'bg-beige',
  itemsPerRow = 'auto',
  imageSpacing = 0,
}) => {
  const router = useRouter()
  if (!items.length) return null

  // Define classes based on itemsPerRow setting
  const getItemClasses = () => {
    switch (itemsPerRow) {
      case '2':
        return 'w-full sm:w-1/2 md:w-1/2 lg:w-1/2 xl:w-1/2 p-3'
      case '3':
        return 'w-full sm:w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/3 p-3'
      case '4':
        return 'w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/4 p-3'
      case '1':
        return 'w-full sm:w-1/2 md:w-1/2 lg:w-1/2 xl:w-1/2 p-3'
      case 'auto':
      default:
        // For auto, we'll use flex-grow-0 to let items take their natural size
        return 'p-3 flex-shrink-0'
    }
  }

  const itemClass = getItemClasses()

  return (
    <div className={cn('w-full py-3', backgroundColor)}>
      <div className="mx-auto px-4">
        {itemsPerRow === 'auto' ? (
          // Flexible layout with justify-around
          <div className={`flex flex-wrap justify-around items-center gap-[${imageSpacing}px]`}>
            {items.map((item, idx) => (
              <div key={idx} className={itemClass}>
                {item}
              </div>
            ))}
          </div>
        ) : (
          // Fixed columns layout
          <div className={`flex flex-wrap gap-[${imageSpacing}px]`}>
            {items.map((item, idx) => (
              <div key={idx} className={itemClass}>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaGrid
