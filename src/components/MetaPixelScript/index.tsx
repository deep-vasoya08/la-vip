'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { initializeMetaPixel } from '@/lib/meta-pixel'

/**
 * Meta Pixel (Facebook Pixel) Script Component
 * Initializes Meta Pixel for conversion tracking
 */
export const MetaPixelScript = () => {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  useEffect(() => {
    // Initialize Meta Pixel on client side
    if (pixelId) {
      initializeMetaPixel(pixelId)
    }
  }, [pixelId])

  // Return null if no pixel ID is configured
  if (!pixelId) {
    console.warn('Meta Pixel ID not configured. Set NEXT_PUBLIC_META_PIXEL_ID in your .env file.')
    return null
  }

  return (
    <>
      {/* Meta Pixel Base Code */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Meta Pixel Noscript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
