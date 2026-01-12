import type { Block } from 'payload'

export const FleetListConfig: Block = {
  slug: 'fleetList',
  interfaceName: 'FleetListConfig',
  imageURL: '/images/block-previews/fleet-list-block.svg',
  labels: {
    singular: 'Fleet List',
    plural: 'Fleet Lists',
  },
  fields: [
    {
      name: 'selectedFleets',
      label: 'Fleets',
      type: 'relationship',
      relationTo: 'fleets',
      hasMany: true,
      required: true,
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      defaultValue: 'OUR SOUTHERN CALIFORNIA TRANSPORTATION',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      defaultValue:
        'LA VIP offers a range of fleet vehicles including Sprinter vans, luxury mini-busses, mini-coaches, and motor coaches to accommodate various group sizes and preferences.',
      required: true,
    },
    {
      name: 'limit',
      label: 'Number of Fleets to Show',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 12,
    },
    {
      name: 'ctaText',
      label: 'Call-to-Action Text',
      type: 'text',
      defaultValue: 'BOOK A CHARTER',
      required: true,
    },
    {
      name: 'ctaUrl',
      label: 'Call-to-Action URL',
      type: 'text',
      defaultValue: '#',
      required: true,
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'select',
      options: [
        {
          label: 'White',
          value: 'bg-white',
        },
        {
          label: 'Light Gray',
          value: 'bg-gray-100',
        },
        {
          label: 'Mustard',
          value: 'bg-mustard',
        },
      ],
      defaultValue: 'bg-white',
      required: true,
    },
  ],
}
