// visualChecklist.config.ts

import { Block } from 'payload'

export const VisualChecklistBlock: Block = {
  slug: 'vcBlock',
  interfaceName: 'VisualChecklistBlock',
  imageURL: '/images/block-previews/visual-checklist-block.svg',
  labels: {
    singular: 'Visual Checklist',
    plural: 'Visual Checklists',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: 'Checklist Heading',
    },
    {
      name: 'textColor',
      type: 'select',
      required: true,
      defaultValue: 'text-gray',
      options: [
        {
          label: 'Gray',
          value: 'text-gray',
        },
        {
          label: 'Mustard',
          value: 'text-mustard',
        },
        {
          label: 'Rust',
          value: 'text-rust',
        },
        {
          label: 'Black',
          value: 'text-black',
        },
      ],
      label: 'Heading Text Color',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Checklist Image',
    },
    {
      name: 'isImageAbsolute',
      type: 'checkbox',
      label: 'Position image over content',
      admin: {
        description: 'When checked, the image will be positioned absolutely over the content',
      },
    },
    {
      name: 'isImageVisibleForMobile',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show image for mobile',
      admin: {
        description: 'When checked, the image will be visible for mobile',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      label: 'Checklist Items',
      minRows: 1,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: 'Item Text',
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Custom Icon (optional)',
        },
        {
          name: 'itemTextColor',
          type: 'select',
          required: true,
          defaultValue: 'text-gray',
          options: [
            {
              label: 'Gray',
              value: 'text-gray',
            },
            {
              label: 'Mustard',
              value: 'text-mustard',
            },
            {
              label: 'Rust',
              value: 'text-rust',
            },
            {
              label: 'Black',
              value: 'text-black',
            },
          ],
          label: 'Item Text Color',
        },
      ],
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
  ],
}
