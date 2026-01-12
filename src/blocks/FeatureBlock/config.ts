import { Block } from 'payload'

// Define the FeatureBlock fields for Payload CMS
export const FeatureBlockConfig: Block = {
  slug: 'featureBlock',
  interfaceName: 'FeatureBlockConfig',
  imageURL: '/images/block-previews/feature-block.svg',
  labels: {
    singular: 'Feature Block',
    plural: 'Feature Blocks',
  },
  fields: [
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      minRows: 1,
      maxRows: 10,
      fields: [
        {
          name: 'heading',
          label: 'Heading',
          type: 'text',
        },
        // {
        //   name: 'headingTextColor',
        //   type: 'select',
        //   required: true,
        //   defaultValue: 'text-gray',
        //   options: [
        //     { label: 'White', value: 'text-white' },
        //     { label: 'Beige', value: 'text-beige' },
        //     { label: 'Black', value: 'text-black' },
        //     { label: 'Mustard', value: 'text-mustard' },
        //     { label: 'Gray', value: 'text-gray' },
        //     { label: 'Rust', value: 'text-rust' },
        //   ],
        //   label: 'Heading Text Color',
        // },
        {
          name: 'subheading',
          label: 'Subheading',
          type: 'text',
        },
        // {
        //   name: 'subheadingTextColor',
        //   type: 'select',
        //   required: true,
        //   defaultValue: 'text-gray',
        //   options: [
        //     { label: 'White', value: 'text-white' },
        //     { label: 'Beige', value: 'text-beige' },
        //     { label: 'Black', value: 'text-black' },
        //     { label: 'Mustard', value: 'text-mustard' },
        //     { label: 'Gray', value: 'text-gray' },
        //     { label: 'Rust', value: 'text-rust' },
        //   ],
        //   label: 'Subheading Text Color',
        // },
        {
          name: 'image',
          label: 'Feature Image',
          type: 'upload',
          relationTo: 'media',
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
            {
              name: 'newTab',
              type: 'checkbox',
              label: 'Open in new tab',
              defaultValue: true,
            },
          ],
        },
        {
          name: 'backgroundColor',
          label: 'Background Color',
          type: 'select',
          options: [
            { label: 'Beige', value: 'bg-beige' },
            { label: 'White', value: 'bg-white' },
          ],
          defaultValue: 'bg-beige',
        },
      ],
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'select',
      options: [
        { label: 'Beige', value: 'bg-beige' },
        { label: 'White', value: 'bg-white' },
      ],
      defaultValue: 'bg-beige',
    },
  ],
}
