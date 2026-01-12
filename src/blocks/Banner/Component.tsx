import { cn } from '@/utilities/ui'
import { BannerBlockConfig } from '@/payload-types'
import React from 'react'
import RichText from '@/components/RichText'

export const BannerBlock: React.FC<BannerBlockConfig> = ({ content, style }) => {
  return (
    <div className={cn('mx-auto my-8 w-full')}>
      <div
        className={cn('border py-3 px-6 flex items-center rounded', {
          'border-border bg-card': style === 'info',
          'border-error bg-error/30': style === 'error',
          'border-success bg-success/30': style === 'success',
          'border-warning bg-warning/30': style === 'warning',
        })}
      >
        <RichText data={content} enableGutter={false} enableProse={false} />
      </div>
    </div>
  )
}
