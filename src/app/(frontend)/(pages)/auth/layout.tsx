'use client'

import React from 'react'
import { cn } from '@/utilities/ui'
// import { roboto, semplicita } from '@/app/fonts'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn('min-h-screen flex flex-col')}>
      <main className="flex-grow flex items-center justify-center bg-beige">{children}</main>
    </div>
  )
}
