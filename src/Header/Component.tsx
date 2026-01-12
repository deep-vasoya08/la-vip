import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Footer, Header } from '@/payload-types'

export async function Header() {
  const headerData = (await getCachedGlobal('header', 1)()) as Header
  const footerData = (await getCachedGlobal('footer', 1)()) as Footer

  return <HeaderClient headerData={headerData} footerData={footerData} />
}
