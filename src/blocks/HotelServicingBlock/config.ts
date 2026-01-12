import { Block } from 'payload'

export const HotelServicingConfig: Block = {
  slug: 'hotelServicing',
  interfaceName: 'HotelServicingConfig',
  imageURL: '/images/block-previews/hotel-servicing-block.svg',
  labels: {
    singular: 'Hotel Servicing',
    plural: 'Hotels Servicing',
  },
  fields: [
    {
      name: 'heading',
      label: 'Heading',
      type: 'text',
      required: false,
    },
    {
      name: 'headingTextColor',
      label: 'Heading Text Color',
      type: 'select',
      required: true,
      defaultValue: 'text-purple',
      options: [
        { label: 'White', value: 'text-white' },
        { label: 'Beige', value: 'text-beige' },
        { label: 'Black', value: 'text-black' },
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
        { label: 'Rust', value: 'text-rust' },
        { label: 'Purple', value: 'text-purple' },
      ],
    },
    {
      name: 'subheading',
      label: 'Subheading',
      type: 'text',
      required: false,
    },
    {
      name: 'subheadingTextColor',
      label: 'Subheading Text Color',
      type: 'select',
      required: true,
      defaultValue: 'text-gray',
      options: [
        { label: 'White', value: 'text-white' },
        { label: 'Beige', value: 'text-beige' },
        { label: 'Black', value: 'text-black' },
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
        { label: 'Rust', value: 'text-rust' },
      ],
    },
    {
      name: 'selectedHotels',
      label: 'Selected Hotels',
      type: 'relationship',
      relationTo: 'hotels',
      hasMany: true,
      admin: {
        description:
          'Put Empty to show all hotels. Choose specific hotels to display in the carousel. Only active hotels will be shown to visitors.',
      },
    },
  ],
}

export default HotelServicingConfig
