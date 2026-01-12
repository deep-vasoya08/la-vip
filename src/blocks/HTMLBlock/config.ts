import type { Block } from 'payload'

export const HTMLBlockConfig: Block = {
  slug: 'htmlBlock',
  interfaceName: 'HTMLBlockConfig',
  imageURL: '/images/block-previews/html-block.svg',
  labels: {
    singular: 'HTML Block',
    plural: 'HTML Blocks',
  },
  fields: [
    {
      name: 'htmlContent',
      type: 'textarea',
      label: 'HTML Content',
      admin: {
        description: 'Enter raw HTML code that will be rendered directly on the page',
        rows: 20,
        style: {
          fontFamily: 'monospace',
        },
      },
      maxLength: 100000000, // Setting a very high limit
      validate: (value) => {
        if (!value) return true
        if (value.length > 100000000) return 'HTML content is too large'
        return true
      },
      required: true,
    },
  ],
}
