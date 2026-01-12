import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Venues: CollectionConfig = {
  slug: 'venues',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'address', 'city', 'facilities'],
    group: 'Places Management',
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Information',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              label: 'Venue Name',
            },
            {
              name: 'address',
              type: 'textarea',
              required: true,
              label: 'Address',
            },
            {
              name: 'city',
              type: 'text',
              label: 'City',
            },
            {
              name: 'facilities',
              type: 'textarea',
              label: 'Facilities',
              admin: {
                description: 'List available facilities (Parking, WiFi, etc.)',
              },
            },
          ],
        },
        {
          label: 'Images',
          fields: [
            {
              name: 'images',
              type: 'array',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
