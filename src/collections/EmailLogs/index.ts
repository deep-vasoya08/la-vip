import type { CollectionConfig } from 'payload'

export const EmailLogs: CollectionConfig = {
  slug: 'email-logs',
  labels: {
    singular: 'Email Log',
    plural: 'Email Logs',
  },
  admin: {
    defaultColumns: ['sentTo', 'subject', 'emailType', 'status', 'sentAt'],
    useAsTitle: 'subject',
    group: 'System',
  },
  access: {
    // Only admins can view email logs
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return false
    },
    create: () => true, // Allow system to create logs
    update: () => false, // Logs should not be updated
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return false
    },
  },
  fields: [
    {
      name: 'sentTo',
      type: 'email',
      label: 'Sent To',
      required: true,
      admin: {
        description: 'Email address the email was sent to',
      },
    },
    {
      name: 'sentFrom',
      type: 'email',
      label: 'Sent From',
      admin: {
        description: 'Email address the email was sent from',
      },
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Subject',
      required: true,
    },
    {
      name: 'emailType',
      type: 'select',
      label: 'Email Type',
      required: true,
      options: [
        {
          label: 'Tour Booking Confirmation',
          value: 'tour_booking_confirmation',
        },
        {
          label: 'Resend Email',
          value: 'resend_email',
        },
        {
          label: 'Event Booking Confirmation',
          value: 'event_booking_confirmation',
        },
        {
          label: 'Event Booking Cancellation',
          value: 'event_booking_cancellation',
        },
        {
          label: 'Tour Booking Cancellation',
          value: 'tour_booking_cancellation',
        },
        {
          label: 'Event Refund',
          value: 'event_refund',
        },
        {
          label: 'Tour Refund',
          value: 'tour_refund',
        },
        {
          label: 'Event Pending Payment',
          value: 'event_pending_payment',
        },
        {
          label: 'Tour Pending Payment',
          value: 'tour_pending_payment',
        },
        {
          label: 'Password Reset',
          value: 'password_reset',
        },
        {
          label: 'User Registration',
          value: 'user_registration',
        },
        {
          label: 'Payment Failed',
          value: 'payment_failed',
        },
        {
          label: 'Payment Succeeded',
          value: 'payment_succeeded',
        },
        {
          label: 'Test Email',
          value: 'test_email',
        },
        {
          label: 'Admin Copy',
          value: 'admin_copy',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      admin: {
        description: 'Type of email sent',
      },
    },
    {
      name: 'templateId',
      type: 'text',
      label: 'Template ID',
      admin: {
        description: 'SendGrid template ID used (if dynamic template)',
      },
    },
    {
      name: 'templateData',
      type: 'json',
      label: 'Template Data',
      admin: {
        description: 'Data sent to the email template',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'sent',
      options: [
        {
          label: 'Sent Successfully',
          value: 'sent',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
        {
          label: 'Pending',
          value: 'pending',
        },
      ],
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      label: 'Error Message',
      admin: {
        description: 'Error message if email failed to send',
        condition: (data) => data.status === 'failed',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      label: 'Sent At',
      defaultValue: () => new Date(),
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Related User',
      admin: {
        description: 'User this email was sent to (if registered user)',
      },
    },
    {
      name: 'bookingReference',
      type: 'text',
      label: 'Booking Reference',
      admin: {
        description: 'Related booking reference (if applicable)',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Additional Metadata',
      admin: {
        description: 'Additional data related to the email',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Ensure sentAt is set if not provided
        if (!data.sentAt) {
          data.sentAt = new Date()
        }
        return data
      },
    ],
  },
}
