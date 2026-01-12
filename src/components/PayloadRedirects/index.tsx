import type React from 'react'
import type { Page } from '@/payload-types'
// Post type import removed

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirects = await getCachedRedirects()()
  // Normalize URL path for comparison
  const normalizePath = (path: string): string => {
    try {
      const urlObj = new URL(path)
      return urlObj.pathname
    } catch {
      // If it's not a full URL, use it as is
      return path.startsWith('/') ? path : `/${path}`
    }
  }

  const redirectItem = redirects.find((r) => {
    const redirectFrom = normalizePath(r.from)
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`
    return redirectFrom === normalizedUrl
  })

  if (redirectItem) {
    // Handle custom URL redirects
    if (redirectItem.to?.type === 'custom' && redirectItem.to?.url) {
      redirect(redirectItem.to.url)
      return
    }

    // Handle reference redirects
    if (redirectItem.to?.type === 'reference' && redirectItem.to?.reference) {
      let redirectUrl: string

      if (typeof redirectItem.to.reference.value === 'string') {
        const collection = redirectItem.to.reference.relationTo
        const id = redirectItem.to.reference.value

        const document = (await getCachedDocument(collection, id)()) as Page // | Post - post type removed
        redirectUrl = `${redirectItem.to.reference.relationTo !== 'pages' ? `/${redirectItem.to.reference.relationTo}` : ''}/${
          document?.slug
        }`
      } else {
        redirectUrl = `${redirectItem.to.reference.relationTo !== 'pages' ? `/${redirectItem.to.reference.relationTo}` : ''}/${
          typeof redirectItem.to.reference.value === 'object'
            ? redirectItem.to.reference.value?.slug
            : ''
        }`
      }

      if (redirectUrl) {
        redirect(redirectUrl)
        return
      }
    }
  }

  if (disableNotFound) return null

  notFound()
}
