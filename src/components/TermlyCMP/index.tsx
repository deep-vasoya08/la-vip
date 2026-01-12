'use client'

import { useEffect } from 'react'

interface TermlyCMPProps {
  websiteUUID?: string
}

export const TermlyCMP: React.FC<TermlyCMPProps> = ({
  websiteUUID = process.env.NEXT_PUBLIC_TERMLY_WEBSITE_UUID || '',
}) => {
  useEffect(() => {
    const normalizedUUID = (websiteUUID || '').trim().replace(/^['"]|['"]$/g, '') // strip accidental wrapping quotes

    if (!normalizedUUID) {
      console.warn('TermlyCMP: NEXT_PUBLIC_TERMLY_WEBSITE_UUID environment variable is not set')
      return
    }

    // Check if Termly script is already loaded
    const expectedSrcPrefix = `https://app.termly.io/resource-blocker/${normalizedUUID}`
    const alreadyLoaded = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[src*="termly.io"]'),
    ).some((script) => (script.src || '').startsWith(expectedSrcPrefix))
    if (alreadyLoaded) return

    // Create and append the Termly script (resource-blocker variant)
    const script = document.createElement('script')
    script.src = `https://app.termly.io/resource-blocker/${normalizedUUID}?autoBlock=on`
    script.async = true

    // Append to head
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="termly.io"]'))
        .filter((s) => (s.src || '').startsWith(expectedSrcPrefix))
        .forEach((s) => s.remove())
    }
  }, [websiteUUID])

  return null
}
