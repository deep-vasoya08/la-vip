import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faqBlock',
  interfaceName: 'FAQBlock',
  imageURL: '/images/block-previews/faq-block.svg',
  labels: {
    singular: 'FAQ Block',
    plural: 'FAQ Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'FAQ Section Title',
      required: true,
    },
    {
      name: 'backgroundStyle',
      type: 'select',
      label: 'Background Style',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Cream', value: 'cream' },
      ],
      defaultValue: 'cream',
    },
    {
      name: 'sideImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Side Image',
    },
    {
      name: 'imagePosition',
      type: 'select',
      label: 'Image Position',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'left',
    },
    {
      name: 'faqs',
      type: 'array',
      label: 'Frequently Asked Questions',
      fields: [
        {
          name: 'question',
          type: 'text',
          label: 'Question',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          label: 'Answer',
          admin: {
            description:
              'You can use [highlight]text[/highlight] to highlight words, [paragraph]...[/paragraph] to create multiple paragraphs, and [link:url]text[/link] to create links. Examples: [paragraph]First [highlight]highlighted[/highlight] paragraph.[/paragraph][paragraph]Second paragraph with a [link:https://example.com]link[/link].[/paragraph]',
          },
        },
        {
          name: 'isOpen',
          type: 'checkbox',
          label: 'Initially Open',
          defaultValue: false,
        },
        {
          name: 'logos',
          type: 'array',
          label: 'Logos (if needed for this answer)',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo',
              required: true,
            },
            {
              name: 'name',
              type: 'text',
              label: 'Organization Name (alt text)',
            },
            {
              name: 'link',
              type: 'text',
              label: 'Link (Optional)',
            },
          ],
        },
      ],
    },
  ],
  graphQL: {
    singularName: 'FAQBlock',
  },
}
