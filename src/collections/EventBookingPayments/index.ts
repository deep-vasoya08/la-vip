import type { CollectionConfig } from 'payload'

export const EventBookingPayments: CollectionConfig = {
  slug: 'event_booking_payments',
  labels: {
    singular: 'Event Booking Payment',
    plural: 'Event Booking Payments',
  },
  admin: {
    useAsTitle: 'paymentReference',
    defaultColumns: ['paymentReference', 'booking', 'paymentStatus', 'amount', 'paymentDate'],
    group: 'Events Management',
  },
  access: {
    create: () => true,
    read: async ({ req }) => {
      if (req.user && req.user.role?.includes('admin')) return true
      if (req.user) return { user: { equals: req.user.id } }
      return false
    },
    update: async ({ req }) => {
      if (req.user && req.user.role?.includes('admin')) return true
      if (req.user) return { user: { equals: req.user.id } }
      return false
    },
    delete: ({ req }) => {
      if (req.user && req.user.role?.includes('admin')) return true
      if (req.user) return { user: { equals: req.user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'paymentReference',
      type: 'text',
      required: true,
      admin: { description: 'Unique payment reference' },
    },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'event_bookings',
      hasMany: true,
      required: true,
      admin: { description: 'Associated booking' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: { description: 'Paying user' },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
        { label: 'Completed', value: 'completed' },
      ],
      admin: { description: 'Payment status' },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: { description: 'Payment amount' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'USD',
      options: [{ label: 'USD', value: 'USD' }],
    },
    {
      name: 'paymentMethod',
      type: 'text',
      required: true,
      admin: { description: 'Payment method' },
    },
    {
      name: 'stripeDetails',
      type: 'group',
      admin: { description: 'Stripe payment details' },
      fields: [
        {
          name: 'stripePaymentIntentId',
          type: 'text',
          admin: { description: 'Stripe Payment Intent ID' },
        },
        { name: 'stripeCustomerId', type: 'text', admin: { description: 'Stripe Customer ID' } },
        { name: 'paymentMethodType', type: 'text', admin: { description: 'Payment method type' } },
        { name: 'receiptUrl', type: 'text', admin: { description: 'Receipt URL' } },
        {
          name: 'metadata',
          type: 'json',
          admin: { description: 'Additional payment metadata' },
        },
      ],
    },
    {
      name: 'paymentDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Payment date',
      },
    },
    {
      name: 'transactionId',
      type: 'text',
      admin: { description: 'Transaction ID' },
    },
    {
      name: 'refundStatus',
      type: 'select',
      options: [
        { label: 'Not Refunded', value: 'not_refunded' },
        { label: 'Refund Pending', value: 'pending' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Refund Failed', value: 'failed' },
      ],
      defaultValue: 'not_refunded',
      admin: { description: 'Refund status', position: 'sidebar' },
    },
    {
      name: 'refundedAmount',
      type: 'number',
      admin: {
        description: 'Amount refunded (can be partial)',
        position: 'sidebar',
        condition: (data) => data.refundStatus !== 'not_refunded',
      },
    },
    {
      name: 'stripeRefundId',
      type: 'text',
      admin: { description: 'Stripe Refund ID', readOnly: true },
    },
    {
      name: 'refundReceiptUrl',
      type: 'text',
      admin: { description: 'Refund receipt URL', readOnly: true },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Payment notes' },
    },
    {
      name: 'others',
      type: 'text',
      admin: { description: 'Other payment details' },
    },
  ],
  timestamps: true,
}
