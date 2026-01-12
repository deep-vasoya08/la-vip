'use client'

import React, { useCallback, useEffect } from 'react'
import { LocalReviewsConfig } from '@/payload-types'
// import styles from './LocalReviews.module.css'

export const LocalReviewsBlock: React.FC<LocalReviewsConfig> = ({ widgetId }) => {
  // Memoized function to load the LocalReviews script
  const loadLocalReviewsScript = useCallback(() => {
    if (!widgetId) return

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src*="${widgetId}"]`)
    if (existingScript) return

    // Create and append the script
    const script = document.createElement('script')
    script.src = `https://api.localreviews.com/api/v2/widget/reviews/${widgetId}.js?t=${Date.now()}`
    script.type = 'text/javascript'
    script.async = true
    script.onload = () => {
      console.log('LocalReviews widget loaded successfully')
    }
    script.onerror = () => {
      console.error('Failed to load LocalReviews widget')
    }

    document.head.appendChild(script)
  }, [widgetId])

  // Memoized cleanup function
  const cleanupScript = useCallback(() => {
    if (!widgetId) return

    const script = document.querySelector(`script[src*="${widgetId}"]`)
    if (script) {
      script.remove()
    }
  }, [widgetId])

  useEffect(() => {
    // Load the script
    loadLocalReviewsScript()

    // Cleanup function to remove script if component unmounts
    return cleanupScript
  }, [loadLocalReviewsScript, cleanupScript])

  if (!widgetId) {
    return (
      <div className={`px-4 py-8 mx-auto max-w-screen-xl`}>
        <p className="text-center text-gray-500">LocalReviews widget ID is required</p>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        color: 'black !important',
      }}
    >
      {/* Widget container - the script will inject content here */}
      <div id={widgetId}></div>
    </div>
  )
}
