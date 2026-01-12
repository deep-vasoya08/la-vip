import { Block } from 'payload'

export const NewsletterBlock: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  imageURL: '/images/block-previews/newsletter-block.svg',
  labels: {
    singular: 'Newsletter',
    plural: 'Newsletter Blocks',
  },
  fields: [
    {
      name: 'headline',
      label: 'Headline',
      type: 'text',
      defaultValue: 'Join our Newsletter to learn about exclusive offers and events!',
      required: true,
    },
    {
      name: 'buttonText',
      label: 'Button Text',
      type: 'text',
      defaultValue: 'NEWSLETTER SIGN UP',
      required: true,
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'select',
      options: [
        {
          label: 'Mustard',
          value: 'bg-mustard',
        },
        {
          label: 'Rust',
          value: 'bg-rust',
        },
        {
          label: 'Gray',
          value: 'bg-gray',
        },
      ],
      defaultValue: 'bg-mustard',
      required: true,
    },
  ],
}
