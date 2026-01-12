'use client'

import { useEffect } from 'react'

export function ShopperApprovedBadge() {
  useEffect(() => {
    // Load the Shopper Approved CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = '//www.shopperapproved.com/svg-seal/112.css'
    document.head.appendChild(link)

    // Setup the click handler for shopper links
    const openshopperapproved = function (e: Event) {
      const isIE = navigator.appName === 'Microsoft Internet Explorer'
      const windowHeight = screen.availHeight - 90
      const windowWidth = window.innerWidth < 1400 ? 620 : 940

      const link = e.currentTarget as HTMLAnchorElement
      window.open(
        link.href,
        'shopperapproved',
        `location=${isIE ? 'yes' : 'no'},scrollbars=yes,width=${windowWidth},height=${windowHeight},menubar=no,toolbar=no`,
      )

      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Attach the click handler to all shopper links
    document.querySelectorAll('.shopperlink').forEach((link) => {
      link.addEventListener('click', openshopperapproved as EventListener)
    })

    // Cleanup function
    return () => {
      document.querySelectorAll('.shopperlink').forEach((link) => {
        link.removeEventListener('click', openshopperapproved as EventListener)
      })
    }
  }, [])

  return (
    <a
      href="https://www.shopperapproved.com/reviews/laviptours.com"
      className="shopperlink new-sa-seals placement-112"
    >
      <img
        src="//www.shopperapproved.com/svg-seal/41381/112-sa-seal.svg"
        style={{ borderRadius: '4px' }}
        alt="Customer Reviews"
        onContextMenu={(e) => {
          alert(
            'Copying Prohibited by Law - This image and all included logos are copyrighted by Shopper Approved.',
          )
          e.preventDefault()
          return false
        }}
      />
    </a>
  )
}
