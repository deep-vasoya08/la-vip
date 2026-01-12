import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { link } from '@/fields/link'
import {
  revalidateEventsSitemap,
  revalidateEventsSitemapOnDelete,
} from './hooks/revalidateEventsSitemap'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'venue', 'category', 'duration_hours', 'status'],
    group: 'Events Management',
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
              label: 'Event Name',
            },
            {
              name: 'venue',
              type: 'relationship',
              relationTo: 'venues',
              required: true,
              label: 'Venue',
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Description',
            },
            {
              name: 'duration_hours',
              type: 'number',
              // required: true,
              min: 1,
              label: 'Duration (Hours)',
              admin: {
                description: 'Event duration in hours',
              },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Category',
              admin: {
                description: 'Select a category for this event',
              },
            },
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'active',
              options: [
                {
                  label: 'Active',
                  value: 'active',
                },
                {
                  label: 'Inactive',
                  value: 'inactive',
                },
                {
                  label: 'Cancelled',
                  value: 'cancelled',
                },
              ],
            },
            {
              name: 'eventAvatarImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Event Avatar Image',
            },
            {
              name: 'eventDetailsPageLink',
              type: 'group',
              label: 'Event Details Page Link',
              fields: [
                link({
                  appearances: false,
                  disableLabel: true,
                }),
              ],
              admin: {
                description: 'Link to the event details page',
              },
            },
          ],
        },

        {
          label: 'Schedule & Pickups',
          fields: [
            {
              name: 'schedules',
              type: 'array',
              label: 'Event Schedules',
              minRows: 1,
              admin: {
                description: 'Add multiple schedule dates with pickup details for this event',
              },
              fields: [
                {
                  label: 'Event Date & Time',
                  name: 'event_date_time',
                  type: 'date',
                  required: true,
                  timezone: true,
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                    description: 'Date and time when this event is scheduled',
                  },
                },
                {
                  name: 'schedule_status',
                  type: 'select',
                  required: true,
                  defaultValue: 'scheduled',
                  label: 'Schedule Status',
                  options: [
                    {
                      label: 'Scheduled',
                      value: 'scheduled',
                    },
                    {
                      label: 'Confirmed',
                      value: 'confirmed',
                    },
                    {
                      label: 'Cancelled',
                      value: 'cancelled',
                    },
                    {
                      label: 'Completed',
                      value: 'completed',
                    },
                  ],
                },
                {
                  name: 'schedule_notes',
                  type: 'textarea',
                  label: 'Schedule Notes',
                  admin: {
                    description: 'Special instructions for this event date',
                  },
                },
                {
                  name: 'pickups',
                  type: 'array',
                  label: 'Hotel Pickups for this Schedule',
                  admin: {
                    description:
                      'Add pickup details for different hotels for this specific schedule',
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
                      name: 'pickup_times',
                      type: 'array',
                      required: true,
                      label: 'Pickup Times',
                      admin: {
                        description: 'Multiple pickup times available for this hotel',
                      },
                      fields: [
                        {
                          name: 'time',
                          type: 'date',
                          required: true,
                          label: 'Pickup Time',
                          timezone: true,
                          admin: {
                            date: {
                              pickerAppearance: 'dayAndTime',
                            },
                            description: 'Time for pickup at this hotel',
                          },
                        },
                      ],
                    },
                    {
                      name: 'adult_price',
                      type: 'number',
                      required: true,
                      min: 0,
                      label: 'Rider Price',
                      admin: {
                        description: 'Price per rider for this pickup',
                        step: 0.01,
                      },
                    },
                    {
                      name: 'children_price',
                      type: 'number',
                      // required: true,
                      // min: 0,
                      label: 'Children Price',
                      admin: {
                        description: 'Price per child for this pickup',
                        // step: 0.01,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Event Images',
          fields: [
            {
              name: 'eventImages',
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
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateEventsSitemap],
    afterDelete: [revalidateEventsSitemapOnDelete],
  },
  timestamps: true,
}
