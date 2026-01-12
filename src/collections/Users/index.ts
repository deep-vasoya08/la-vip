import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

// Define our own User type since we can't import it correctly
type PayloadUser = {
  id: number
  email: string
  collection: string
  role?: 'admin' | 'user'
  phoneNumber?: string
  receiveTexts?: boolean
}

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: () => true, // Allow users to register
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
    group: 'Users Management',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'googleId',
      type: 'text',
      access: {
        read: ({ req }) => {
          const user = req.user as unknown as PayloadUser
          return Boolean(user?.role === 'admin')
        },
      },
      admin: {
        position: 'sidebar',
        description: 'Google account ID for OAuth users',
      },
    },
    {
      name: 'appleId',
      type: 'text',
      access: {
        read: ({ req }) => {
          const user = req.user as unknown as PayloadUser
          return Boolean(user?.role === 'admin')
        },
      },
      admin: {
        position: 'sidebar',
        description: 'Apple account ID for OAuth users',
      },
    },
    {
      name: 'image',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Profile image URL (usually from OAuth provider)',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      access: {
        create: ({ req }) => {
          // Use type assertion with unknown as intermediate step
          const user = req.user as unknown as PayloadUser
          return Boolean(user?.role === 'admin')
        },
        update: ({ req }) => {
          // Use type assertion with unknown as intermediate step
          const user = req.user as unknown as PayloadUser
          return Boolean(user?.role === 'admin')
        },
      },
    },

    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'receiveTexts',
      type: 'checkbox',
      label: 'Receive Text Messages',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Stripe Customer ID',
        readOnly: true,
      },
      access: {
        read: ({ req }) => {
          const user = req.user as unknown as PayloadUser
          return Boolean(user?.role === 'admin')
        },
      },
    },
  ],
  timestamps: true,
}
