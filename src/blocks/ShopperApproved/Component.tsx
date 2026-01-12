import * as React from 'react'

import { ShopperApprovedBlockConfig } from '@/payload-types'
import ShopperApprovedBlockClient from './Component.client'

export const ShopperApprovedBlock: React.FC<ShopperApprovedBlockConfig> = (props) => {
  return <ShopperApprovedBlockClient {...props} />
}

export default ShopperApprovedBlock
