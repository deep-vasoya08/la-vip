import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { BOOKING_REFERENCE_STRING, PAYMENT_REFERENCE_STRING } from '../../utilities/constant'
import { sendBookingNotificationEmail } from '../../utilities/eventBookingNotifications'
import {
  calculateEventBookingPricing,
  canCalculatePricing,
  isPricingMissing,
} from '../../utilities/eventBookingPricingUtils'
import { updateShopperApprovedReview } from '@/lib/shopperApproved'
import { sendBookingConfirmationEmail } from '@/lib/emailService'
import { formatEventBookingForEmail } from '@/utilities/bookingEmailUtils'

export const EventBookings: CollectionConfig = {
  slug: 'event_bookings',
  labels: {
    singular: 'Event Trip',
    plural: 'Event Trips',
  },
  admin: {
    useAsTitle: 'bookingReference',
    defaultColumns: ['bookingReference', 'event', 'status', 'createdAt'],
    group: 'Events Management',
    components: {
      beforeList: ['@/components/EventBookingsList'],
    },
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Auto-generate booking reference if empty using utility function
        if (!data.bookingReference) {
          data.bookingReference = BOOKING_REFERENCE_STRING('event')
        }

        // If payment is marked as collected, set status to confirmed
        // This works for both create and update operations
        if (data.paymentCollected === true && data.status !== 'confirmed') {
          data.status = 'confirmed'
        }

        // Generate secure access token for new bookings

        // Auto-calculate pricing if missing data or if any required pricing field is empty
        if (canCalculatePricing(data) && (isPricingMissing(data) || !data.pricing?.adultPrice)) {
          try {
            const result = await calculateEventBookingPricing({
              eventId: data.event,
              scheduleId: data.scheduleId,
              pickupLocationId: data.pickupDetails.locationId,
              adultCount: data.adultCount || 0,
              childCount: data.childCount || 0,
            })

            if (result.success && result.pricing) {
              // Auto-populate pricing
              data.pricing = {
                ...data.pricing, // Keep any existing pricing data
                ...result.pricing,
              }

              // Auto-populate hotel ID if available and not already set
              if (!data.pickupDetails.hotelId && result.hotelId) {
                data.pickupDetails.hotelId = result.hotelId
              }

              console.log(`Auto-calculated pricing for booking: $${result.pricing.totalAmount}`)
            } else {
              console.warn('Could not auto-calculate pricing:', result.error)
            }
          } catch (error) {
            console.error('Error auto-calculating pricing:', error)
            // Don't throw error, just log it so booking can still be created
          }
        }

        return data
      },
    ],
    afterOperation: [
      async ({ operation, req, result }) => {
        // ONLY handle create operations - afterOperation runs for ALL operations (create, update, find, findByID, etc.)
        // We must be very specific to avoid running this for read operations
        if (operation !== 'create') {
          return
        }

        // Create payment record for confirmed bookings (runs after transaction is committed)
        if (result && req.user?.role === 'admin') {
          const doc = result

          // Create payment record if payment is marked as collected and status is confirmed
          if (doc.paymentCollected && doc.status === 'confirmed') {
            // Defer payment creation with retry logic to handle heavy load scenarios
            setImmediate(async () => {
              const createPaymentWithRetry = async (
                maxRetries = 5,
                initialDelay = 500,
              ): Promise<void> => {
                for (let attempt = 0; attempt < maxRetries; attempt++) {
                  // Exponential backoff: 500ms, 1000ms, 2000ms, 4000ms, 8000ms
                  const delay = initialDelay * Math.pow(2, attempt)
                  await new Promise((resolve) => setTimeout(resolve, delay))

                  try {
                    const paymentReference = PAYMENT_REFERENCE_STRING('event')

                    await req.payload.create({
                      collection: 'event_booking_payments',
                      data: {
                        paymentReference,
                        booking: [doc.id],
                        user: typeof doc.user === 'object' ? doc.user.id : doc.user,
                        paymentStatus: 'completed',
                        amount: doc.pricing?.totalAmount || 0,
                        currency: doc.pricing?.currency || 'USD',
                        paymentMethod: 'manual_phone_pos',
                        paymentDate: new Date().toISOString(),
                        transactionId: `MANUAL-${doc.bookingReference}`,
                        notes: 'Payment collected via phone/POS by admin',
                      },
                    })
                    console.log(
                      `✅ Created payment record: ${paymentReference} (attempt ${attempt + 1})`,
                    )
                    return // Success - exit retry loop
                  } catch (paymentError) {
                    const errorMessage =
                      paymentError instanceof Error ? paymentError.message : String(paymentError)

                    // Check if it's a foreign key constraint error (transaction not committed yet)
                    const isForeignKeyError =
                      errorMessage.includes('foreign key constraint') ||
                      errorMessage.includes('violates foreign key')

                    if (isForeignKeyError && attempt < maxRetries - 1) {
                      console.log(
                        `⏳ Payment record creation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay * 2}ms...`,
                      )
                      continue // Retry
                    } else {
                      // Either it's not a foreign key error, or we've exhausted retries
                      console.error(
                        `❌ Failed to create payment record after ${attempt + 1} attempts:`,
                        errorMessage,
                      )
                      throw paymentError // Stop retrying
                    }
                  }
                }
              }

              try {
                await createPaymentWithRetry()
              } catch (_finalError) {
                // Final error after all retries - log but don't crash
                console.error('Payment record creation failed after all retries')
              }
            })
          }
        }
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Handle email notifications for admin-created bookings
        if (operation === 'create' && req.user?.role === 'admin') {
          try {
            // Case 1: Payment collected manually - Send confirmation email
            if (doc.paymentCollected) {
              // Format data for email
              const emailData = await formatEventBookingForEmail(doc)
              // Send confirmation email
              await sendBookingConfirmationEmail({
                ...emailData,
                bookingType: 'event',
              })
              console.log('✅ Sent booking confirmation email for manually paid booking')
            }
            // Case 2: Payment pending - Send payment request email (default behavior)
            else if (doc.status === 'pending') {
              await sendBookingNotificationEmail(doc)
            }
          } catch (error) {
            console.error('Failed to send booking email:', error)
            // Don't throw error to prevent booking creation failure
          }
        }

        // Log booking access links to console for easy access
        if (operation === 'create') {
          const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

          console.log('\n' + '='.repeat(60))
          console.log('🎉 NEW BOOKING CREATED!')
          console.log('='.repeat(60))
          console.log(`📋 Booking Reference: ${doc.bookingReference}`)
          console.log(`💰 Total Amount: $${doc.pricing?.totalAmount || 0}`)
          console.log(`📅 Status: ${doc.status}`)

          console.log('\n🔗 CLICKABLE LINKS:')
          console.log(
            `⚡ Admin Booking Details: ${baseUrl}/admin/collections/event_bookings/${doc.id}`,
          )
          console.log(`💳 Direct Booking View: ${baseUrl}/my-account/events/${doc.id}`)
          console.log(`🔐 Login Page (if needed): ${baseUrl}/auth/login`)

          console.log('='.repeat(60) + '\n')
        }

        // If booking was cancelled, cancel Shopper Approved follow-up if exists
        try {
          const wasCancelled = doc?.status === 'cancelled'
          const prevStatus = previousDoc?.status
          if (wasCancelled && prevStatus !== 'cancelled') {
            const reviewId = (doc as any)?.reviewFollowup?.reviewId
            const reviewIdOrOrderId = String(reviewId || doc.id)
            const result = await updateShopperApprovedReview({
              reviewIdOrOrderId,
              cancel: true,
              followup: '',
            })
            if (!result.success) {
              console.error('Failed to cancel Shopper Approved follow-up:', result.error)
            }
          }
        } catch (cancelErr) {
          console.error('Error cancelling Shopper Approved follow-up:', cancelErr)
        }
      },
    ],
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
  fields: [
    // Booking Reference Field
    {
      name: 'bookingReference',
      type: 'text',
      required: true,
      admin: {
        description: 'Unique booking reference number (auto-generated if empty)',
      },
    },

    // User Information Row
    {
      type: 'row',
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          hasMany: false,
          required: true,
          admin: { description: 'Attendee user', width: '100%' },
        },
      ],
    },

    // Event Field
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      hasMany: false,
      required: true,
      filterOptions: ({ data }) => {
        // view page data is {}: empty object
        if (Object.keys(data).length === 0 || data === null) {
          return true
        }

        // create page data is something but id is undefined
        else if (Object.keys(data).length !== 0 && data?.id === undefined) {
          return {
            'schedules.event_date_time': {
              greater_than_equal: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          }
        }

        // edit page data is something but id is defined
        else if (Object.keys(data).length !== 0 && data?.id !== undefined) {
          return {
            'schedules.event_date_time': {
              greater_than_equal: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          }
        }

        return true
      },
      admin: {
        description:
          'Event being booked (shows events from last 24 hours when creating/editing, all events when viewing list)',
        sortOptions: 'name',
      },
    },

    // Schedule Field
    {
      name: 'scheduleId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID of the event schedule',
        components: {
          Field: '@/components/customAdminEventBooking/EventScheduleSelector',
        },
      },
    },

    // Participant Count Row
    {
      type: 'row',
      fields: [
        {
          name: 'adultCount',
          type: 'number',
          required: true,
          admin: { description: 'Number of riders', width: '50%' },
        },
        {
          name: 'childCount',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { description: 'Number of children', width: '50%' },
        },
      ],
    },

    // Pickup Details Group
    {
      name: 'pickupDetails',
      type: 'group',
      admin: { description: 'Pickup details' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'locationId',
              type: 'text',
              required: true,
              admin: {
                description: 'Pickup location ID',
                width: '100%',
                components: {
                  Field: '@/components/customAdminEventBooking/PickupLocationSelector',
                },
              },
            },
            {
              name: 'hotelId',
              type: 'number',
              admin: { description: 'Hotel ID', disabled: true },
            },
          ],
        },
        {
          name: 'selectedTimeId',
          type: 'text',
          admin: {
            description: 'Pickup time ID',
            components: {
              Field: '@/components/customAdminEventBooking/PickupTimeSelector',
            },
          },
        },
      ],
    },

    // Pricing Details Group
    {
      name: 'pricing',
      type: 'group',
      admin: { description: 'Pricing details' },
      fields: [
        // Individual Prices Row
        {
          type: 'row',
          fields: [
            {
              name: 'adultPrice',
              type: 'number',
              required: true,
              admin: {
                step: 0.01,
                description: 'Price per rider (auto-calculated)',
                width: '33.33%',
                readOnly: true,
              },
            },
            {
              name: 'childrenPrice',
              type: 'number',
              defaultValue: 0,
              admin: {
                step: 0.01,
                description: 'Price per child (auto-calculated)',
                width: '33.33%',
                readOnly: true,
              },
            },
            {
              name: 'currency',
              type: 'text',
              defaultValue: 'USD',
              admin: { description: 'Currency', width: '33.33%', readOnly: true },
            },
          ],
        },
        // Totals Row
        {
          type: 'row',
          fields: [
            {
              name: 'adultTotal',
              type: 'number',
              required: true,
              admin: {
                step: 0.01,
                description: 'Total for riders (auto-calculated)',
                width: '33.33%',
                readOnly: true,
              },
            },
            {
              name: 'childTotal',
              type: 'number',
              defaultValue: 0,
              admin: {
                step: 0.01,
                description: 'Total for children (auto-calculated)',
                width: '33.33%',
                readOnly: true,
              },
            },
            {
              name: 'totalAmount',
              type: 'number',
              required: true,
              admin: {
                step: 0.01,
                description: 'Total amount (auto-calculated)',
                width: '33.33%',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },

    // Sidebar fields
    {
      name: 'bookedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      defaultValue: ({ user }) => user?.id,
      admin: {
        description: 'Booking creator (defaults to current user)',
        position: 'sidebar',
      },
    },
    {
      name: 'paymentCollected',
      type: 'checkbox',
      label: 'Payment Collected (Phone/POS)',
      defaultValue: false,
      admin: {
        description:
          'Check this to mark as confirmed and send confirmation email instead of payment request.',
        position: 'sidebar',
      },
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
      admin: {
        description: 'Booking status',
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes',
        position: 'sidebar',
      },
    },
    // Shopper Approved review tracking
    {
      name: 'reviewFollowup',
      type: 'group',
      admin: { description: 'Shopper Approved follow-up', position: 'sidebar' },
      fields: [{ name: 'reviewId', type: 'text', label: 'Shopper Approved Review ID' }],
    },
    // Refund Button (Custom Field)
    // {
    //   name: 'refundAction',
    //   type: 'ui',
    //   label: 'Refund & Cancel',
    //   admin: {
    //     position: 'sidebar',
    //     components: {
    //       Field: '@/components/EventBookingsRefundButton',
    //     },
    //   },
    // },
  ],
  timestamps: true,
}
