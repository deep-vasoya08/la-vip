import React from 'react'
import { cn } from '@/utilities/ui'
import { Star } from 'lucide-react'
import { RatingBlock as RatingBlockProps } from '@/payload-types'

interface StarRatingProps {
  className?: string
}

const StarRating: React.FC<StarRatingProps> = ({ className }) => {
  return (
    <div className={cn('flex justify-center mb-6', className)}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} color="#FFD700" fill={'#FFD700'} size={24} className="mx-1" />
      ))}
    </div>
  )
}

export const RatingBlock: React.FC<RatingBlockProps> = ({
  mainText = "Whether you're planning something grand or just want to make an ordinary day feel extraordinary, we're here to make your charter experience unforgettable.",
  secondaryText = "Because at LA VIP Tours, we don't just move people—we elevate the journey.",
  cardBackgroundColor,
  textColor,
  showRating,
}) => {
  return (
    <div className={cn('w-full py-6 md:py-8 px-6 md:px-12', cardBackgroundColor, textColor)}>
      <div className="container mx-auto max-w-4xl">
        {showRating && <StarRating />} {/* Conditionally render stars */}
        {mainText && (
          <p className="text-center font-semplicita font-medium text-base md:text-lg lg:text-xl mb-2 leading-relaxed">
            {mainText}
          </p>
        )}
        {secondaryText && (
          <p className="text-center font-semplicita text-sm md:text-base lg:text-lg leading-relaxed">
            {secondaryText}
          </p>
        )}
      </div>
    </div>
  )
}

export default RatingBlock
