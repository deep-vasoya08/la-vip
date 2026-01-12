import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Hotels: CollectionConfig = {
  slug: 'hotels',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: () => true, // Allow public read access
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'location', 'priority'],
    useAsTitle: 'name',
    group: 'Places Management',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'priority',
      type: 'number',
      required: true,
      defaultValue: 50,
      min: 1,
      max: 100,
      admin: {
        description:
          'Priority order for displaying hotels (1 = highest priority, 100 = lowest priority). Default is 50.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
    },
    {
      name: 'partnerValidTill',
      type: 'date',
      label: 'Partner Valid Till',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description:
          'After this date, tours can no longer be booked for this hotel pickup. Leave empty if partnership has no expiration.',
      },
    },
    {
      label: 'Hotel Logo',
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'Select an image as a logo for the Trusted Partner. This will be displayed on the Trusted Partner block. Pick something that represents the concept or purpose of the Partner.',
      },
    },
  ],
  timestamps: true,
}
