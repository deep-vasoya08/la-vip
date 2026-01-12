import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { PAYMENT_REFERENCE_STRING } from '@/utilities/constant'

export const TourBookings: CollectionConfig = {
  slug: 'tour_bookings',
  labels: {
    singular: 'Tour Trip',
    plural: 'Tour Trips',
  },
  admin: {
    useAsTitle: 'bookingReference',
    defaultColumns: ['bookingReference', 'tour', 'status', 'createdAt'],
    group: 'Tours Management',
    components: {
      beforeList: ['@/components/TourBookingsList'],
    },
  },
  access: {
    create: () => true,
    read: async ({ req }) => {
      if (req.user && req.user.role?.includes('admin')) return true
      if (req.user) return { user: { equals: req.user.id } }
      return false
    },
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc }) => {
        try {
          const wasCancelled = doc?.status === 'cancelled'
          const prevStatus = previousDoc?.status
          if (wasCancelled && prevStatus !== 'cancelled') {
            const reviewId = (doc as any)?.reviewFollowup?.reviewId
            const reviewIdOrOrderId = String(reviewId || doc.id)
            const { updateShopperApprovedReview } = await import('@/lib/shopperApproved')
            const result = await updateShopperApprovedReview({
              reviewIdOrOrderId,
              cancel: true,
              followup: '',
            })
            if (!result.success) {
              console.error('Failed to cancel Shopper Approved follow-up (tour):', result.error)
            }
          }
        } catch (err) {
          console.error('Error cancelling Shopper Approved follow-up (tour):', err)
        }
      },
    ],
  },
  fields: [
    {
      name: 'bookingReference',
      type: 'text',
      required: true,
      admin: { description: 'Unique booking reference number' },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (!data?.bookingReference) {
              return PAYMENT_REFERENCE_STRING('tour')
            }
            return data?.bookingReference
          },
        ],
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: { description: 'Attendee user' },
    },
    {
      name: 'bookedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: { description: 'Booking creator', position: 'sidebar' },
    },
    {
      name: 'tour',
      type: 'relationship',
      relationTo: 'tours',
      hasMany: false,
      required: true,
      admin: { description: 'Tour being booked' },
    },
    {
      name: 'scheduledDate',
      type: 'date',
      required: true,
      admin: { description: 'Date and time of the scheduled tour' },
    },
    {
      name: 'adultCount',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: 'Number of riders' },
    },
    {
      name: 'childCount',
      type: 'number',
      min: 0,
      admin: { description: 'Number of children' },
    },
    {
      name: 'pickupDetails',
      type: 'group',
      admin: { description: 'Pickup details' },
      fields: [
        {
          name: 'locationId',
          type: 'text',
          required: true,
          admin: { description: 'Pickup location ID' },
        },
        {
          name: 'hotelId',
          type: 'number',
          required: true,
          admin: { description: 'Hotel ID' },
        },
        {
          name: 'pickupDateTime',
          type: 'date',
          required: true,
          admin: { description: 'Calculated pickup date and time' },
        },
        {
          name: 'tourDateTime',
          type: 'date',
          required: true,
          admin: { description: 'Tour date and time' },
        },
      ],
    },
    {
      name: 'pricing',
      type: 'group',
      admin: { description: 'Pricing details' },
      fields: [
        {
          name: 'adultPrice',
          type: 'number',
          required: true,
          admin: { step: 0.01, description: 'Price per rider' },
        },
        {
          name: 'childrenPrice',
          type: 'number',
          required: true,
          admin: { step: 0.01, description: 'Price per child' },
        },
        {
          name: 'adultTotal',
          type: 'number',
          required: true,
          admin: { step: 0.01, description: 'Total for riders' },
        },
        {
          name: 'childTotal',
          type: 'number',
          required: true,
          admin: { step: 0.01, description: 'Total for children' },
        },
        {
          name: 'totalAmount',
          type: 'number',
          required: true,
          admin: { step: 0.01, description: 'Total amount' },
        },
        { name: 'currency', type: 'text', defaultValue: 'USD', admin: { description: 'Currency' } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Completed', value: 'completed' },
      ],
      admin: { description: 'Booking status' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Additional notes' },
    },
    // Shopper Approved review tracking
    {
      name: 'reviewFollowup',
      type: 'group',
      admin: { description: 'Shopper Approved follow-up', position: 'sidebar' },
      fields: [{ name: 'reviewId', type: 'text', label: 'Shopper Approved Review ID' }],
    },
  ],
  timestamps: true,
}
