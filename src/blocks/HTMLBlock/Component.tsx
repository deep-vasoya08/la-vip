import React from 'react'
import { HTMLBlockConfig } from '@/payload-types'

export const HTMLBlockComponent: React.FC<HTMLBlockConfig> = ({ htmlContent }) => {
  if (!htmlContent) return null

  return (
    <div className="px-20 mx-auto max-w-screen-5xl html-block-container !bg-white">
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}
