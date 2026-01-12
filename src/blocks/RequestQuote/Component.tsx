import React from 'react'
import { RequestQuoteConfig } from '@/payload-types'
import RequestQuoteClient from './Component.client'

export const RequestQuoteBlock: React.FC<
  RequestQuoteConfig & { disableInnerContainer?: boolean }
> = ({ requireAuthentication = false }) => {
  return <RequestQuoteClient requireAuthentication={requireAuthentication ?? false} />
}
