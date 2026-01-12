import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="LA VIP Logo"
      width={200}
      height={45}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx(
        'w-auto h-12 sm:h-16 md:h-14 lg:h-16',
        'max-w-[12rem] sm:max-w-[16rem] md:max-w-[16rem]',
        'object-contain',
        className,
      )}
      src="/images/la-vip-tours-and-charters-logo.webp"
    />
  )
}
