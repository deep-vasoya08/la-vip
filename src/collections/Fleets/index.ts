import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { link } from '@/fields/link'

export const Fleets: CollectionConfig = {
  slug: 'fleets',
  admin: {
    useAsTitle: 'vehicleName',
    defaultColumns: ['vehicleName', 'description'],
    group: 'Fleets Management',
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
      name: 'vehicleName',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'fleetDetailsPageLink',
      type: 'group',
      label: 'Fleet Details Page Link',
      fields: [
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'type',
                    type: 'radio',
                    admin: {
                      layout: 'horizontal',
                      width: '50%',
                    },
                    defaultValue: 'reference',
                    options: [
                      {
                        label: 'Internal link',
                        value: 'reference',
                      },
                      {
                        label: 'Custom URL',
                        value: 'custom',
                      },
                    ],
                  },
                  {
                    name: 'newTab',
                    type: 'checkbox',
                    admin: {
                      style: {
                        alignSelf: 'flex-end',
                      },
                      width: '50%',
                    },
                    label: 'Open in new tab',
                  },
                ],
              },
              {
                name: 'reference',
                type: 'relationship',
                admin: {
                  condition: (_, siblingData) => siblingData?.type === 'reference',
                },
                label: 'Document to link to',
                relationTo: ['pages'],
                required: false,
              },
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: (_, siblingData) => siblingData?.type === 'custom',
                },
                label: 'Custom URL',
                required: false,
              },
            ],
          },
        }),
      ],
      admin: {
        description: 'Link to the fleet details page',
      },
    },
  ],
  timestamps: true,
}
