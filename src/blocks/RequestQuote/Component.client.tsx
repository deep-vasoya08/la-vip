'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui'

// Extract referrer detection logic to avoid duplication
const detectSourceFromReferrer = (referrer: string, hasMsclkid: boolean): string | null => {
  if (!referrer) return null

  if (hasMsclkid || (referrer.includes('bing.com') && referrer.includes('search'))) {
    return 'bing-ads'
  } else if (referrer.includes('google.com') || referrer.includes('googleads.g.doubleclick.net')) {
    return 'google-ads'
  } else if (referrer.includes('facebook.com') || referrer.includes('fb.com')) {
    return 'facebook-ad'
  } else if (referrer.includes('instagram.com')) {
    return 'instagram-ad'
  } else if (referrer.includes('linkedin.com') || referrer.includes('lnkd.in')) {
    return 'linkedin-ad'
  } else if (referrer.includes('yelp.com')) {
    return 'yelp-quote-form'
  } else if (referrer.includes('tripadvisor.com')) {
    return 'trip-advisor'
  } else if (referrer.includes('viator.com')) {
    return 'viator'
  } else if (referrer.includes('youtube.com')) {
    return 'youtube-ad'
  } else if (referrer.includes('yahoo.com')) {
    return 'yahoo'
  } else {
    try {
      const referrerDomain = new URL(referrer).hostname
      return referrerDomain.replace('www.', '')
    } catch {
      return null
    }
  }
}

export default function RequestQuoteClient({ requireAuthentication = false }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)

  // Memoize iframe URL to prevent unnecessary recalculations
  const iframeUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'https://customers.app.busify.com/widget/la-vip-tours-1'
    }

    const urlParams = new URLSearchParams(window.location.search)
    const tag = urlParams.get('tag')

    const baseUrl = 'https://customers.app.busify.com/widget/la-vip-tours-1'

    if (tag) {
      try {
        const iframeUrlObj = new URL(baseUrl)
        iframeUrlObj.searchParams.set('tag', tag)
        return iframeUrlObj.toString()
      } catch (error) {
        console.error('Failed to append tag to iframe URL:', error)
      }
    }

    return baseUrl
  }, [])

  // Redirect only if authentication is required and not authenticated
  useEffect(() => {
    if (requireAuthentication && !isLoading && !isAuthenticated) {
      window.location.href = '/auth/login'
    }
  }, [isAuthenticated, isLoading, requireAuthentication])

  // Add tag parameter to URL on page load (deferred to not block iframe)
  useEffect(() => {
    // Use setTimeout to defer non-critical work, allowing iframe to start loading first
    const timeoutId = setTimeout(() => {
      if (typeof window === 'undefined') return

      const urlParams = new URLSearchParams(window.location.search)
      const existingTag = urlParams.get('tag')
      const existingUtmSource = urlParams.get('utm_source')
      const hasMsclkid = urlParams.has('msclkid')

      // Only add tag if it doesn't already exist
      if (!existingTag && !existingUtmSource) {
        const referrer = document.referrer
        const dynamicSource = detectSourceFromReferrer(referrer, hasMsclkid)

        if (dynamicSource && dynamicSource !== 'direct') {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin
            const url = new URL(window.location.pathname + window.location.search, baseUrl)
            url.searchParams.set('tag', dynamicSource)
            window.history.replaceState({}, '', url.toString())
          } catch (error) {
            console.error('Failed to add tag parameter to URL:', error)
          }
        }
      }
    }, 0) // Defer to next tick, allowing iframe to start loading first

    return () => clearTimeout(timeoutId)
  }, [])

  // Listen for quote widget submission events from Busify
  const handleMessage = useCallback((event: MessageEvent) => {
    // Security: Restrict to Busify widget origin
    if (event.origin !== 'https://customers.app.busify.com') {
      return
    }

    if (event?.data?.event === 'quoteWidgetSubmitted') {
      const managedId = event.data.quoteManagedId
      const urlParams = new URLSearchParams(window.location.search)
      const queryParams: Record<string, string> = {}

      urlParams.forEach((value, key) => {
        queryParams[key] = value
      })

      console.log('Quote widget submitted:', { managedId, queryParams })

      try {
        const referrer = document.referrer
        const currentUrl = window.location.href
        const hasMsclkid = urlParams.has('msclkid')

        let dynamicSource = queryParams.tag || queryParams.utm_source || ''

        if (!dynamicSource && referrer) {
          dynamicSource = detectSourceFromReferrer(referrer, hasMsclkid) || 'direct-call'
        } else if (!dynamicSource) {
          dynamicSource = 'direct'
        }

        if (!queryParams.tag && dynamicSource && dynamicSource !== 'direct') {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin
            const url = new URL(window.location.pathname + window.location.search, baseUrl)
            url.searchParams.set('tag', dynamicSource)
            window.history.replaceState({}, '', url.toString())
            queryParams.tag = dynamicSource
            console.log('Added tag parameter to URL:', dynamicSource)
          } catch (error) {
            console.error('Failed to update URL with tag parameter:', error)
          }
        }

        if (typeof window !== 'undefined') {
          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({
            event: 'quoteWidgetSubmitted',
            quoteManagedId: managedId,
            queryParams: queryParams,
            timestamp: new Date().toISOString(),
            dynamicSource: dynamicSource,
            referrer: referrer,
            currentUrl: currentUrl,
            utm_source: queryParams.utm_source || '',
            utm_medium: queryParams.utm_medium || '',
            utm_campaign: queryParams.utm_campaign || '',
            utm_term: queryParams.utm_term || '',
            utm_content: queryParams.utm_content || '',
            tag: queryParams.tag || dynamicSource,
          })
        }
      } catch (error) {
        console.error('Failed to push conversion event to dataLayer:', error)
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleMessage])

  // Show loading state while checking authentication (only if auth is required)
  if (requireAuthentication && isLoading) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />
  }

  // If authentication is required and not authenticated, return null while redirecting
  if (requireAuthentication && !isAuthenticated) {
    return null
  }

  const handleIframeLoad = () => {
    console.log('iframe loaded')
    setIframeLoading(false)
  }

  const handleIframeError = () => {
    console.log('iframe error')
    setIframeError(true)
    setIframeLoading(false)
  }

  // If authenticated, show the iframe with loading state
  return (
    <div className="w-full h-screen relative">
      {iframeLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <LoadingSpinner fullScreen message="Loading quote request form..." />
        </div>
      )}

      {iframeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-2">Unable to load form</h2>
            <p className="text-black mb-4">There was an error loading the quote request form.</p>
            <Button
              onClick={() => {
                setIframeError(false)
                setIframeLoading(true)
                // Force reload the iframe by temporarily changing src
                const iframe = document.querySelector('iframe')
                if (iframe) {
                  // Force reload by clearing and resetting src
                  iframe.src = ''
                  setTimeout(() => {
                    if (iframe) {
                      iframe.src = iframeUrl
                    }
                  }, 10)
                }
              }}
              variant="mustard"
              size="large"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      <iframe
        src={iframeUrl}
        width="100%"
        height="100%"
        loading="eager"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ opacity: iframeLoading ? 0 : 1 }}
      />
    </div>
  )
}
