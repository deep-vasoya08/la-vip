// components/Footer/config.ts
import type { GlobalConfig } from 'payload'
import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Footer Logo',
    },
    {
      name: 'address',
      type: 'text',
      label: 'Address',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
    },
    {
      name: 'email',
      type: 'text',
      label: 'Email Address',
    },
    {
      name: 'faqLink',
      type: 'group',
      label: 'FAQ Link',
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Media Links',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Platform Name',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: 'Open in new tab',
          defaultValue: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Social Icon',
        },
      ],
      admin: {
        initCollapsed: true,
      },
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Legal Links',
      fields: [
        link({
          appearances: false,
        }),
      ],
      admin: {
        initCollapsed: true,
      },
    },
    {
      name: 'websiteCredit',
      type: 'text',
      label: 'Website Credit Text',
    },
    {
      name: 'websiteCreditUrl',
      type: 'text',
      label: 'Website Credit URL',
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
