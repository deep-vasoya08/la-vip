'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui'

export default function RequestQuoteClient() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)
  const [iframeUrl, setIframeUrl] = useState(
    'https://customers.app.busify.com/widget/la-vip-tours-1',
  )

  // Redirect only if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // router.push('/auth/login')
      window.location.href = '/auth/login'
    }
  }, [isAuthenticated, isLoading, router])

  // Add tag parameter to URL on page load if not present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const existingTag = urlParams.get('tag')
      const existingUtmSource = urlParams.get('utm_source')
      const hasMsclkid = urlParams.has('msclkid')

      // Only add tag if it doesn't already exist
      if (!existingTag && !existingUtmSource) {
        const referrer = document.referrer
        let dynamicSource = ''

        if (referrer) {
          if (hasMsclkid) {
            dynamicSource = 'bing-ads'
          } else if (
            referrer.includes('google.com') ||
            referrer.includes('googleads.g.doubleclick.net')
          ) {
            dynamicSource = 'google-ads'
          } else if (referrer.includes('facebook.com') || referrer.includes('fb.com')) {
            dynamicSource = 'facebook'
          } else if (referrer.includes('instagram.com')) {
            dynamicSource = 'instagram'
          } else if (referrer.includes('linkedin.com') || referrer.includes('lnkd.in')) {
            dynamicSource = 'linkedin'
          } else if (referrer.includes('yelp.com')) {
            dynamicSource = 'yelp'
          } else if (referrer.includes('bing.com')) {
            dynamicSource = 'bing'
          } else if (referrer.includes('yahoo.com')) {
            dynamicSource = 'yahoo'
          } else {
            try {
              const referrerDomain = new URL(referrer).hostname
              dynamicSource = referrerDomain.replace('www.', '')
            } catch {
              // Don't add tag for direct traffic
            }
          }

          // Add the tag to URL if we detected a source
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
      }
    }
  }, [])

  // Update iframe URL with tag parameter from current URL
  useEffect(() => {
    const updateIframeUrl = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const tag = urlParams.get('tag')

        let newIframeUrl = 'https://customers.app.busify.com/widget/la-vip-tours-1'

        if (tag) {
          try {
            const iframeUrlObj = new URL(newIframeUrl)
            iframeUrlObj.searchParams.set('tag', tag)
            newIframeUrl = iframeUrlObj.toString()
          } catch (error) {
            console.error('Failed to append tag to iframe URL:', error)
          }
        }

        setIframeUrl(newIframeUrl)
      }
    }

    // Update on initial load
    updateIframeUrl()

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', updateIframeUrl)

    // Poll for URL changes (in case tag is added via replaceState)
    // This ensures we catch when the tag is added dynamically
    const intervalId = setInterval(updateIframeUrl, 500)

    return () => {
      window.removeEventListener('popstate', updateIframeUrl)
      clearInterval(intervalId)
    }
  }, [])

  // Listen for quote widget submission events from Busify
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Restrict to Busify widget origin as recommended
      if (event.origin !== 'https://customers.app.busify.com') {
        return
      }

      // Verify the event data structure
      if (event?.data?.event === 'quoteWidgetSubmitted') {
        const managedId = event.data.quoteManagedId

        // Get current URL parameters for attribution tracking
        const urlParams = new URLSearchParams(window.location.search)
        const queryParams: Record<string, string> = {}

        // Convert URLSearchParams to object
        urlParams.forEach((value, key) => {
          queryParams[key] = value
        })

        console.log('Quote widget submitted:', { managedId, queryParams })

        try {
          // Get referrer information for dynamic source tracking
          const referrer = document.referrer
          const currentUrl = window.location.href

          // Determine source dynamically based on referrer or existing tag parameter
          let dynamicSource = queryParams.tag || queryParams.utm_source || ''

          if (!dynamicSource && referrer) {
            if (
              referrer.includes('google.com') ||
              referrer.includes('googleads.g.doubleclick.net')
            ) {
              dynamicSource = 'google-ads'
            } else if (referrer.includes('facebook.com') || referrer.includes('fb.com')) {
              dynamicSource = 'facebook'
            } else if (referrer.includes('instagram.com')) {
              dynamicSource = 'instagram'
            } else if (referrer.includes('linkedin.com') || referrer.includes('lnkd.in')) {
              dynamicSource = 'linkedin'
            } else if (referrer.includes('yelp.com')) {
              dynamicSource = 'yelp'
            } else if (referrer.includes('bing.com')) {
              dynamicSource = 'bing'
            } else if (referrer.includes('yahoo.com')) {
              dynamicSource = 'yahoo'
            } else {
              // Extract domain from referrer for other sources
              try {
                const referrerDomain = new URL(referrer).hostname
                dynamicSource = referrerDomain.replace('www.', '')
              } catch {
                dynamicSource = 'direct'
              }
            }
          } else if (!dynamicSource) {
            dynamicSource = 'direct'
          }

          // Update URL with tag parameter if it doesn't exist and we have a dynamic source
          if (!queryParams.tag && dynamicSource && dynamicSource !== 'direct') {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin
              const url = new URL(window.location.pathname + window.location.search, baseUrl)
              url.searchParams.set('tag', dynamicSource)

              // Update the URL without causing a page reload
              window.history.replaceState({}, '', url.toString())

              // Update our queryParams object to reflect the new URL
              queryParams.tag = dynamicSource

              console.log('Added tag parameter to URL:', dynamicSource)
            } catch (error) {
              console.error('Failed to update URL with tag parameter:', error)
            }
          }

          // Push to GTM dataLayer for conversion tracking with query params
          if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || []
            window.dataLayer.push({
              event: 'quoteWidgetSubmitted',
              quoteManagedId: managedId,
              queryParams: queryParams,
              timestamp: new Date().toISOString(),
              // Enhanced source tracking
              dynamicSource: dynamicSource,
              referrer: referrer,
              currentUrl: currentUrl,
              // Include individual UTM parameters for easier GTM setup
              utm_source: queryParams.utm_source || '',
              utm_medium: queryParams.utm_medium || '',
              utm_campaign: queryParams.utm_campaign || '',
              utm_term: queryParams.utm_term || '',

              utm_content: queryParams.utm_content || '',
              // Add the tag parameter specifically
              tag: queryParams.tag || dynamicSource,
            })
          }
        } catch (error) {
          console.error('Failed to push conversion event to dataLayer:', error)
        }
      }
    }

    // Add event listener for postMessage events
    window.addEventListener('message', handleMessage)

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />
  }

  // If not authenticated, return null while redirecting
  if (!isAuthenticated) {
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
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ opacity: iframeLoading ? 0 : 1 }}
      />
    </div>
  )
}
