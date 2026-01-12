import type { Block } from 'payload'

export const HotelsBlockConfig: Block = {
  slug: 'hotelsBlock',
  interfaceName: 'HotelsBlockConfig',
  imageURL: '/images/block-previews/hotels-block.svg',
  labels: {
    singular: 'Hotels Block',
    plural: 'Hotels Blocks',
  },
  fields: [
    {
      name: 'relationTo',
      type: 'select',
      defaultValue: 'hotels',
      label: 'Collections To Show',
      options: [
        {
          label: 'Hotels',
          value: 'hotels',
        },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.relationTo === 'hotels',
        step: 1,
      },
      defaultValue: 10,
      label: 'Limit',
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.relationTo === 'hotels',
      },
      hasMany: true,
      label: 'Selection',
      relationTo: ['hotels'],
    },
  ],
}
