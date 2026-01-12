import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { link } from '@/fields/link'

export const Tours: CollectionConfig = {
  slug: 'tours',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tourType', 'duration_hours'],
    group: 'Tours Management',
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
              label: 'Tour Name',
            },
            {
              name: 'isBookable',
              type: 'checkbox',
              label: 'Is Bookable',
              defaultValue: false,
              admin: {
                description: 'If enabled, you can manage Schedule & Pickups for this tour',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              label: 'Short Description',
              required: true,
              admin: {
                description: 'Short description for tour listings',
              },
            },
            {
              name: 'description',
              type: 'richText',
              label: 'Description',
              required: true,
              admin: {
                description: 'Brief description for tour listings',
              },
            },
            {
              name: 'duration_hours',
              type: 'number',
              required: true,
              min: 1,
              defaultValue: 1,
              label: 'Duration (Hours)',
              admin: {
                description: 'Tour duration in hours',
              },
            },
            {
              name: 'tour_start_date',
              type: 'date',
              required: false,
              label: 'Tour Start Date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                },
                description: 'The date when this tour becomes available for booking (optional)',
              },
            },
            {
              name: 'tourAvatarImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Tour Avatar Image',
            },
            {
              name: 'tourDetailsPageHeroImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Tour Details Page Hero Image',
            },

            {
              name: 'tourDetailsPageLink',
              type: 'group',
              label: 'Tour Details Page Link',
              fields: [
                link({
                  appearances: false,
                  disableLabel: true,
                }),
              ],
              admin: {
                description: 'Link to the tour details page',
              },
            },
          ],
        },
        {
          label: 'Schedule & Availability',
          admin: {
            condition: (data: any) => Boolean(data?.isBookable),
          },
          fields: [
            {
              name: 'tour_start_time',
              type: 'date',
              required: false,
              label: 'Tour Start Time',
              admin: {
                date: {
                  pickerAppearance: 'timeOnly',
                },
                description: 'What time does this tour start each day? (e.g., 9:00 AM)',
              },
            },
            {
              name: 'recurrence_rule',
              type: 'text',
              required: false,
              label: 'Recurrence Rule (RRULE)',
              admin: {
                components: {
                  Field: {
                    path: '@/fields/rruleField',
                  },
                },
                description: 'Configure when this tour runs using the visual interface below.',
              },
            },
            {
              name: 'booking_window_months',
              type: 'number',
              required: false,
              label: 'Booking Window (Months)',
              min: 1,
              max: 24,
              defaultValue: 6,
              admin: {
                description: 'How many months in advance can customers book this tour?',
              },
            },
            {
              name: 'schedule_notes',
              type: 'textarea',
              label: 'Schedule Notes',
              admin: {
                description: 'General notes about tour timing and availability',
              },
            },
          ],
        },
        {
          label: 'Pickups',
          admin: {
            condition: (data) => Boolean(data?.isBookable),
          },
          fields: [
            {
              name: 'pickups',
              type: 'array',
              label: 'Hotel Pickups',
              admin: {
                description: 'Add pickup details for different hotels for this tour',
              },
              fields: [
                {
                  name: 'hotel',
                  type: 'relationship',
                  relationTo: 'hotels',
                  required: true,
                  hasMany: false,
                  label: 'Hotel',
                },
                {
                  name: 'pickup_time',
                  type: 'date',
                  required: true,
                  label: 'Pickup Time',
                  admin: {
                    date: {
                      pickerAppearance: 'timeOnly',
                    },
                    description: 'Pickup time for this hotel (e.g., "9:00 AM", "2:30 PM")',
                  },
                },
                {
                  name: 'adult_price',
                  type: 'number',
                  required: true,
                  min: 0,
                  label: 'Adult Price',
                  admin: {
                    description: 'Price per adult for this pickup',
                    step: 0.01,
                  },
                },
                {
                  name: 'children_price',
                  type: 'number',
                  // required: true,
                  min: 0,
                  defaultValue: 0,
                  label: 'Children Price',
                  admin: {
                    description: 'Price per child for this pickup',
                    step: 0.01,
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Tour Images',
          fields: [
            {
              name: 'tourImages',
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
        {
          label: 'Itinerary',
          fields: [
            {
              name: 'itinerary',
              type: 'array',
              label: 'Tour Itinerary',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  label: 'Stop Title',
                },
                {
                  name: 'description',
                  type: 'richText',
                  required: true,
                  label: 'Stop Description',
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Stop Image',
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
