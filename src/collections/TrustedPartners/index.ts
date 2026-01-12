import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { link } from '@/fields/link'

export const TrustedPartners: CollectionConfig = {
  slug: 'trusted_partners',

  labels: {
    singular: 'Trusted Partner/Service',
    plural: 'Trusted Partners/Services',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'logo', 'isActive'],
    group: 'Content Management',
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
      name: 'name',
      type: 'text',
      required: true,
      label: 'Partner Name',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Partner Logo',
    },
    {
      name: 'website',
      type: 'group',
      label: 'Website Link (Optional)',
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
        description: 'Optional link to partner website',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Is Active',
      admin: {
        description: 'Uncheck to hide this partner from display',
      },
    },
  ],
  timestamps: true,
}
