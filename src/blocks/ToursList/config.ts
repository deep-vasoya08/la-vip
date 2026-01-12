import type { Block } from 'payload'

export const ToursListConfig: Block = {
  slug: 'toursList',
  interfaceName: 'ToursListConfig',
  imageURL: '/images/block-previews/tours-list-block.svg',
  labels: {
    singular: 'Tours List',
    plural: 'Tours Lists',
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
  ],
}
