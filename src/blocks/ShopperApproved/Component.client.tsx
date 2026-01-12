'use client'

import * as React from 'react'
import { useEffect, useState, useCallback } from 'react'
import { ShopperApprovedBlockConfig } from '@/payload-types'
import { cn } from '@/utilities/ui'

declare global {
  interface Window {
    sa_values?: {
      site: number
      token: string
      orderid: string
      email: string
    }
  }
}

const ShopperApprovedBlockClient: React.FC<ShopperApprovedBlockConfig> = ({ autoLoad = true }) => {
  const [, setScriptLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Track if component has mounted to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadShopperApprovedScript = useCallback(() => {
    // This is a review page widget that doesn't need orderId or email
    function saLoadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          setScriptLoaded(true)
          resolve()
          return
        }

        // Check if shopper_first is already set
        // @ts-expect-error - window.shopper_first may not be in type definition
        if (window.shopper_first) {
          setScriptLoaded(true)
          resolve()
          return
        }

        const js = document.createElement('script')
        js.src = src
        js.type = 'text/javascript'

        // Set sa_interval globally
        // @ts-expect-error - window.sa_interval may not be in type definition
        window.sa_interval = 5000

        js.onload = () => {
          setScriptLoaded(true)
          // @ts-expect-error - window.shopper_first may not be in type definition
          window.shopper_first = true
          resolve()
        }
        js.onerror = () => reject(new Error(`Failed to load script: ${src}`))

        document.getElementsByTagName('head')[0]?.appendChild(js)
      })
    }

    // Load the ShopperApproved review page script
    saLoadScript(
      'https://www.shopperapproved.com/widgets/41381/merchant/review-page/7ceFsk3pQZW9.js',
    ).catch(() => {
      // Silently handle errors
    })
  }, [])

  useEffect(() => {
    if (autoLoad && mounted) {
      // Load script immediately when component mounts
      loadShopperApprovedScript()
    }
  }, [autoLoad, loadShopperApprovedScript, mounted])

  return (
    <div className={cn('w-full bg-white px-2 sm:px-2 md:px-4 lg:px-6 py-8')}>
      <div className="mx-auto max-w-5xl">
        {/* ShopperApproved review wrapper - script will inject content here */}
        <div id="SA_review_wrapper"></div>
      </div>
    </div>
  )
}

export default ShopperApprovedBlockClient
