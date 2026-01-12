import React from 'react'

export type ChipStatus = 'success' | 'warning' | 'error' | 'info'

interface ChipProps {
  color: ChipStatus
  text: string
  className?: string
  isBackgroundWhite?: boolean
}

const statusColors = {
  success: {
    bg: 'rgba(34, 197, 94, 0.2)',
    text: 'rgb(22, 163, 74)',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.2)',
    text: 'rgb(202, 138, 4)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.2)',
    text: 'rgb(220, 38, 38)',
  },
  info: {
    bg: 'rgba(107, 114, 128, 0.2)',
    text: 'rgb(75, 85, 99)',
  },
}

// Format text by capitalizing first letter and replacing underscores with spaces
const formatText = (text: string): string => {
  // Replace underscores with spaces
  const withSpaces = text.replace(/_/g, ' ')

  // Capitalize first letter
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
}

export const Chip: React.FC<ChipProps> = ({
  color,
  className = '',
  text,
  isBackgroundWhite = false,
}) => {
  const colorConfig = statusColors[color] || statusColors.info
  const displayText = formatText(text)

  return (
    <span
      className={`bg-white ml-2 text-sm px-2 py-0.5 rounded-full bg-opacity-20 inline-block font-roboto ${className}`}
      style={{
        backgroundColor: isBackgroundWhite ? 'white' : colorConfig.bg,
        color: colorConfig.text,
      }}
    >
      {displayText.toUpperCase()}
    </span>
  )
}
