import type { CollectionConfig } from 'payload'

export const AutoLoginSessions: CollectionConfig = {
  slug: 'auto_login_sessions',
  admin: {
    useAsTitle: 'sessionToken',
    defaultColumns: ['user', 'bookingType', 'used', 'expiresAt', 'createdAt'],
    group: 'System',
    description: 'One-time use tokens for secure auto-login functionality',
  },
  access: {
    // Only admins can read/manage these sessions
    read: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    create: () => true, // System can create
    update: () => true, // System can update
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'sessionToken',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique session token for one-time use',
        readOnly: true,
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'User this session belongs to',
      },
    },
    {
      name: 'booking',
      type: 'number',
      required: true,
      index: true,
      admin: {
        description: 'Associated booking ID',
      },
    },
    {
      name: 'bookingType',
      type: 'select',
      required: true,
      options: [
        { label: 'Event', value: 'event' },
        { label: 'Tour', value: 'tour' },
      ],
      admin: {
        description: 'Type of booking (event or tour)',
      },
    },
    {
      name: 'used',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      index: true,
      admin: {
        description: 'Whether this token has been used (one-time use)',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Token expiration timestamp',
        date: {
          displayFormat: 'MMM dd, yyyy h:mm a',
        },
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'IP address that used this token',
        position: 'sidebar',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User agent that used this token',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
  hooks: {
    // Automatically clean up expired sessions periodically
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          // Clean up expired sessions older than 24 hours
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          try {
            await req.payload.delete({
              collection: 'auto_login_sessions',
              where: {
                expiresAt: {
                  less_than: oneDayAgo,
                },
              },
            })
          } catch (error) {
            console.error('Error cleaning up expired auto-login sessions:', error)
          }
        }
        return doc
      },
    ],
  },
}
