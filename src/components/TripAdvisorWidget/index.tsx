'use client'
import { useEffect } from 'react'

export const TripAdvisorWidget = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src =
      'https://www.jscache.com/wejs?wtype=socialButtonIcon&uniq=304&locationId=1101383&color=white&size=lg&lang=en_US&display_version=2'
    script.async = true
    script.onload = () => {
      console.log('TripAdvisor footer script loaded successfully')
    }
    script.onerror = () => {
      console.error('Failed to load TripAdvisor footer script')
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="mb-8 flex justify-center">
      <div id="TA_socialButtonIcon303_footer" className="TA_socialButtonIcon">
        <ul id="YUkharX_footer" className="TA_links bx3XaCvn">
          <li id="x95Az7d6Gxws_footer" className="0DhUwDvOLm">
            <a
              target="_blank"
              href="https://www.tripadvisor.com/Attraction_Review-g32655-d1101383-Reviews-LA_VIP_Tours-Los_Angeles_California.html"
              rel="noopener noreferrer"
            >
              <img
                src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_logomark.svg"
                alt="TripAdvisor"
                width={32}
                height={32}
                className="h-8 w-8 brightness-0 invert"
              />
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
