'use client'

import { useEffect, useRef } from 'react'

interface LiveAgentWidgetProps {
  licenseKey?: string
  buttonId?: string
}

export const LiveAgentWidget: React.FC<LiveAgentWidgetProps> = ({
  licenseKey = 'cmm6jqyg',
  buttonId = 'la_x2s6df8d',
}) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const buttonRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Check if LiveAgent is already loaded
    if (typeof window !== 'undefined' && (window as any).LiveAgent) {
      createButton()
      return
    }

    // Create and load the LiveAgent script
    const script = document.createElement('script')
    script.id = buttonId
    script.defer = true
    script.src = 'https://laviptoursandcharters.ladesk.com/scripts/track.js'

    script.onload = () => {
      // Wait a bit for LiveAgent to fully initialize
      setTimeout(() => {
        createButton()
      }, 1000)
    }

    // Fallback for older browsers
    ;(script as any).onreadystatechange = function () {
      if ((this as any).readyState === 'complete' || (this as any).readyState === 'loaded') {
        setTimeout(() => {
          createButton()
        }, 1000)
      }
    }

    // Insert the script
    const lastScript =
      document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1]
    if (lastScript && lastScript.parentNode) {
      lastScript.parentNode.insertBefore(script, lastScript.nextSibling)
    }

    scriptRef.current = script

    // Cleanup function
    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
    }
  }, [licenseKey, buttonId])

  const createButton = () => {
    if (typeof window !== 'undefined' && (window as any).LiveAgent && buttonRef.current) {
      try {
        ;(window as any).LiveAgent.createButton(licenseKey, buttonRef.current)
      } catch (error) {
        console.error('Error creating LiveAgent button:', error)
      }
    }
  }

  return <div ref={buttonRef} id="liveagent-widget-container" />
}

export default LiveAgentWidget
