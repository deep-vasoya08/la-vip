import { Block } from 'payload'

// Define the DescriptionBlock fields for Payload CMS
export const DescriptionBlockConfig: Block = {
  slug: 'descriptionBlock',
  interfaceName: 'DescriptionBlockConfig',
  imageURL: '/images/block-previews/description-block.svg',
  labels: {
    singular: 'Description Block',
    plural: 'Description Blocks',
  },
  fields: [
    {
      name: 'blockTitle',
      label: 'Block Title',
      type: 'text',
    },
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
      name: 'quoteText',
      label: 'Quote Text',
      type: 'textarea',
      admin: {
        description:
          'You can use [highlight]text[/highlight] to highlight words, and [paragraph]...[/paragraph] to create multiple paragraphs. Example: [paragraph]First [highlight]highlighted[/highlight] paragraph.[/paragraph][paragraph]Second paragraph.[/paragraph]',
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
