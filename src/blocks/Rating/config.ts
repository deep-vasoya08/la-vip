import { Block } from 'payload'

export const Rating: Block = {
  slug: 'ratingBlock',
  interfaceName: 'RatingBlock',
  imageURL: '/images/block-previews/rating-block.svg',
  labels: {
    singular: 'Rating Block',
    plural: 'Rating Blocks',
  },
  fields: [
    {
      name: 'mainText',
      type: 'textarea',
      required: true,
      label: 'Main Text',
      admin: {
        description: 'Primary message displayed in the Rating',
      },
      defaultValue:
        "Whether you're planning something grand or just want to make an ordinary day feel extraordinary, we're here to make your charter experience unforgettable.",
    },
    {
      name: 'secondaryText',
      type: 'textarea',
      required: false,
      label: 'Secondary Text',
      admin: {
        description: 'Optional secondary message displayed below the main text',
      },
      defaultValue: "Because at LA VIP Tours, we don't just move people—we elevate the journey.",
    },
    {
      name: 'cardBackgroundColor',
      type: 'select',
      label: 'Background Color',
      options: [
        {
          label: 'Black',
          value: 'bg-black',
        },
        {
          label: 'Beige',
          value: 'bg-beige',
        },
        {
          label: 'Gray',
          value: 'bg-gray',
        },
        {
          label: 'Rust',
          value: 'bg-rust',
        },
      ],
      required: true,
      defaultValue: 'bg-black',
      admin: {
        description: 'Choose the background color for the Rating block',
      },
    },
    {
      name: 'textColor',
      type: 'select',
      label: 'Text Color',
      options: [
        {
          label: 'White',
          value: 'text-white',
        },
        {
          label: 'Beige',
          value: 'text-beige',
        },
        {
          label: 'Black',
          value: 'text-black',
        },
        {
          label: 'Mustard',
          value: 'text-mustard',
        },
        {
          label: 'Gray',
          value: 'text-gray',
        },
        {
          label: 'Rust',
          value: 'text-rust',
        },
      ],
      required: true,
      defaultValue: 'text-beige',
      admin: {
        description: 'Choose the text color for the Rating block',
      },
    },
    {
      name: 'showRating',
      label: 'Show Rating',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
