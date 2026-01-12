import type { Block } from 'payload'

export const RequestQuoteConfig: Block = {
  slug: 'requestQuote',
  interfaceName: 'RequestQuoteConfig',
  imageURL: '/images/block-previews/request-quote-block.svg',
  labels: {
    singular: 'Request Quote',
    plural: 'Request Quotes',
  },
  fields: [
    {
      name: 'requireAuthentication',
      type: 'checkbox',
      label: 'Require authentication',
      defaultValue: false,
      admin: {
        description: 'If enabled, users must be logged in to view the widget.',
      },
    },
  ],
}
