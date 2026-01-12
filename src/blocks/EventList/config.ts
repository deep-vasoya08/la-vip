import type { Block } from 'payload'
import { link } from '@/fields/link'

export const EventListConfig: Block = {
  slug: 'eventList',
  interfaceName: 'EventListConfig',
  imageURL: '/images/block-previews/events-list-block.svg',
  labels: {
    singular: 'Event List',
    plural: 'Event Lists',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: false,
      label: 'Title',
    },
    {
      name: 'subtitle',
      type: 'text',
      required: false,
      label: 'Subtitle',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      label: 'Filter by Category (Optional)',
      admin: {
        description: 'If a category is selected, only events from this category will display.',
      },
    },
    {
      name: 'selectedEvents',
      type: 'relationship',
      relationTo: 'events',
      required: false,
      hasMany: true,
      label: 'Selected Events (Optional)',
      admin: {
        condition: (_, siblingData) => !siblingData?.category,
        description:
          'If events are selected, only these events will be displayed. Leave empty to show upcoming 8 events.',
      },
    },
    // {
    //   name: 'imageSpacing',
    //   label: 'Image Spacing (px)',
    //   type: 'number',
    //   defaultValue: 24,
    // },
    {
      name: 'backgroundColor',
      label: 'Block Background Color',
      type: 'select',
      options: [
        { label: 'Beige', value: 'bg-beige' },
        { label: 'White', value: 'bg-white' },
        { label: 'Gray', value: 'bg-gray' },
        { label: 'Black', value: 'bg-black' },
      ],
      defaultValue: 'bg-beige',
    },
    {
      name: 'viewType',
      label: 'View Type',
      type: 'select',
      options: [
        { label: 'Grid View', value: 'grid' },
        { label: 'Carousel View', value: 'carousel' },
      ],
      required: true,
      defaultValue: 'carousel',
    },
    {
      name: 'itemsPerRow',
      label: 'Items Per Row',
      type: 'select',
      options: [
        { label: 'Auto (Flexible)', value: 'auto' },
        { label: '1 Item', value: '1' },
        { label: '2 Items', value: '2' },
        { label: '3 Items', value: '3' },
        { label: '4 Items', value: '4' },
      ],
      required: true,
      defaultValue: '4',
    },
    {
      name: 'buttonText',
      label: 'Button Text',
      type: 'text',
      required: false,
    },
    {
      name: 'buttonLink',
      label: 'Button Link',
      type: 'group',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.buttonText),
      },
      fields: [
        link({
          appearances: false,
          disableLabel: false,
        }),
      ],
    },
  ],
}
