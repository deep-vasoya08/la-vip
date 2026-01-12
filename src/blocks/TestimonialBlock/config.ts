import { Block } from 'payload'

export const TestimonialBlockConfig: Block = {
  slug: 'testimonialBlock',
  interfaceName: 'TestimonialBlockConfig',
  imageURL: '/images/block-previews/testimonial-block.svg',
  labels: {
    singular: 'Testimonial Block',
    plural: 'Testimonial Blocks',
  },
  fields: [
    {
      name: 'heading',
      label: 'Heading',
      type: 'text',
    },
    {
      name: 'headingTextColor',
      label: 'Heading Text Color',
      type: 'select',
      required: true,
      defaultValue: 'text-black',
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
        { label: 'Purple', value: 'text-purple' },
      ],
    },
    {
      name: 'testimonials',
      label: 'Testimonials',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'testimonialHeading',
          label: 'Testimonial Heading',
          type: 'text',
          required: false,
          defaultValue: '',
        },
        {
          name: 'testimonialName',
          label: 'Name',
          type: 'text',
          required: true,
        },
        {
          name: 'testimonialPlace',
          label: 'Place',
          type: 'text',
        },
        {
          name: 'testimonialTime',
          label: 'Time',
          type: 'text',
        },
        {
          name: 'testimonialText',
          label: 'Testimonial Text',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'Use [highlight]text[/highlight] to highlight words, and [paragraph]...[/paragraph] to create multiple paragraphs. Example: [paragraph]First [highlight]highlighted[/highlight] paragraph.[/paragraph][paragraph]Second paragraph.[/paragraph]',
          },
        },
      ],
    },
    {
      name: 'showQuote',
      label: 'Show Quote Mark',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'carouselOptions',
      type: 'group',
      label: 'Carousel Options',
      fields: [
        {
          name: 'showNavigation',
          label: 'Show Navigation Arrows',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showDots',
          label: 'Show Dots Navigation',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'hasButton',
      label: 'Include Button',
      type: 'checkbox',
    },
    {
      name: 'button',
      label: 'Button',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData.hasButton === true,
      },
      fields: [
        {
          name: 'text',
          label: 'Button Text',
          type: 'text',
        },
        {
          name: 'link',
          label: 'Button Link',
          type: 'text',
        },
      ],
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'select',
      options: [
        { label: 'Beige', value: 'bg-beige' },
        { label: 'White', value: 'bg-white' },
      ],
      defaultValue: 'bg-beige',
    },
  ],
}
