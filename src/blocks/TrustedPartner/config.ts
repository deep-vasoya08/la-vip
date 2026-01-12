import { Block } from 'payload'

export const TrustedPartnerConfig: Block = {
  slug: 'trustedPartner',
  interfaceName: 'TrustedPartnerConfig',
  imageURL: '/images/block-previews/trusted-partner-block.svg',
  labels: {
    singular: 'Services & Trusted Partners',
    plural: 'Services & Trusted Partners',
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
      name: 'selectedPartners',
      label: 'Selected Partners',
      type: 'relationship',
      relationTo: 'trusted_partners',
      hasMany: true,
      admin: {
        description:
          'Put Empty to show all partners/services. Choose specific trusted partners/services to display in the carousel. Only active partners/services will be shown to visitors.',
      },
    },
  ],
}

export default TrustedPartnerConfig
