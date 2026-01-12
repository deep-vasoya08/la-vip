import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { Block } from 'payload'

// Define the InfoBlock fields for Payload CMS
export const InfoBlockConfig: Block = {
  slug: 'infoBlock',
  interfaceName: 'InfoBlockConfig',
  imageURL: '/images/block-previews/info-block.svg',
  labels: {
    singular: 'Information Block',
    plural: 'Information Blocks',
  },
  fields: [
    {
      name: 'heading',
      label: 'Heading',
      type: 'text',
    },
    {
      name: 'headingTextColor',
      type: 'select',
      required: true,
      defaultValue: 'text-gray',
      options: [
        { label: 'White', value: 'text-white' },
        { label: 'Beige', value: 'text-beige' },
        { label: 'Black', value: 'text-black' },
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
        { label: 'Rust', value: 'text-rust' },
      ],
      label: 'Heading Text Color',
    },
    {
      name: 'subheading',
      label: 'Subheading',
      type: 'text',
    },
    {
      name: 'subheadingTextColor',
      type: 'select',
      required: true,
      defaultValue: 'text-gray',
      options: [
        { label: 'White', value: 'text-white' },
        { label: 'Beige', value: 'text-beige' },
        { label: 'Black', value: 'text-black' },
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
        { label: 'Rust', value: 'text-rust' },
      ],
      label: 'Subheading Text Color',
    },
    {
      name: 'bodyText',
      label: 'Body Text',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({
              enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
    },
    {
      name: 'quoteText',
      label: 'Quote Text',
      type: 'textarea',
      admin: {
        description:
          'Use [highlight] text [/highlight] syntax to highlight specific words or phrases',
      },
    },
    {
      name: 'quoteTextColor',
      type: 'select',
      required: true,
      defaultValue: 'text-gray',
      options: [
        { label: 'White', value: 'text-white' },
        { label: 'Beige', value: 'text-beige' },
        { label: 'Black', value: 'text-black' },
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
        { label: 'Rust', value: 'text-rust' },
      ],
      label: 'Quote Text Color',
    },
    {
      name: 'showQuote',
      label: 'Show Quote Mark',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'hasImage',
      label: 'Include Image',
      type: 'checkbox',
    },
    {
      name: 'image',
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData.hasImage === true,
      },
    },
    {
      name: 'imagePosition',
      label: 'Image Position',
      type: 'select',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
      defaultValue: 'right',
      admin: {
        condition: (_, siblingData) => siblingData.hasImage === true,
      },
    },
    {
      name: 'caption',
      label: 'Image Caption (Optional)',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.hasImage === true,
      },
    },
    {
      name: 'hasButton',
      label: 'Include Button',
      type: 'checkbox',
    },
    {
      name: 'button',
      label: 'Button',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData.hasButton === true,
      },
      fields: [
        {
          name: 'text',
          label: 'Button Text',
          type: 'text',
        },
        {
          name: 'link',
          label: 'Button Link',
          type: 'text',
        },
      ],
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'select',
      options: [
        { label: 'Beige', value: 'beige' },
        { label: 'White', value: 'white' },
      ],
      defaultValue: 'beige',
    },
  ],
}
