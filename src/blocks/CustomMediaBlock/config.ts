import type { Block } from 'payload'
import { link } from '@/fields/link'

export const CustomMediaBlockConfig: Block = {
  slug: 'customMediaBlock',
  imageURL: '/images/block-previews/custom-media-block.svg',
  interfaceName: 'CustomMediaBlockConfig',
  labels: {
    singular: 'Custom Media Block',
    plural: 'Custom Media Blocks',
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
      name: 'mediaItems',
      label: 'Media Items',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'isEventItem',
          type: 'checkbox',
          label: 'Is this an event media item?',
          defaultValue: false,
          admin: {
            condition: () => false,
          },
        },
        {
          name: 'isTourItem',
          type: 'checkbox',
          label: 'Is this a tour media item?',
          defaultValue: false,
          admin: {
            condition: () => false,
          },
        },
        {
          name: 'eventTitle',
          type: 'text',
          label: 'Event Title',
          admin: {
            condition: () => false,
          },
        },
        {
          name: 'eventDate',
          type: 'date',
          label: 'Event Date',
          admin: {
            condition: () => false,
          },
        },
        {
          name: 'eventPlace',
          type: 'text',
          label: 'Event Place',
          admin: {
            condition: () => false,
          },
        },
        {
          name: 'isTeamMember',
          type: 'checkbox',
          label: 'Is this a team member media item?',
          defaultValue: false,
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'd',
          label: 'On Click Media Details Page Link',
          type: 'group',
          admin: {
            description: 'When set, clicking on this media item will navigate to this link.',
            condition: (_, siblingData) => Boolean(siblingData?.media),
          },
          fields: [
            link({
              appearances: false,
              disableLabel: true,
              overrides: {
                fields: [
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'type',
                        type: 'radio',
                        admin: {
                          layout: 'horizontal',
                          width: '50%',
                        },
                        defaultValue: 'reference',
                        options: [
                          {
                            label: 'Internal link',
                            value: 'reference',
                          },
                          {
                            label: 'Custom URL',
                            value: 'custom',
                          },
                        ],
                      },
                      {
                        name: 'newTab',
                        type: 'checkbox',
                        admin: {
                          style: {
                            alignSelf: 'flex-end',
                          },
                          width: '50%',
                        },
                        label: 'Open in new tab',
                      },
                    ],
                  },
                  {
                    name: 'reference',
                    type: 'relationship',
                    admin: {
                      condition: (_, siblingData) => siblingData?.type === 'reference',
                    },
                    label: 'Document to link to',
                    relationTo: ['pages'],
                    required: false,
                  },
                  {
                    name: 'url',
                    type: 'text',
                    admin: {
                      condition: (_, siblingData) => siblingData?.type === 'custom',
                    },
                    label: 'Custom URL',
                    required: false,
                  },
                ],
              },
            }),
          ],
        },
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.isTeamMember),
          },
        },
        {
          name: 'position',
          type: 'text',
          label: 'Position',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.isTeamMember),
          },
        },
        {
          name: 'caption',
          type: 'textarea',
          label: 'Caption',
          admin: {
            description: 'This is the caption that will be displayed below the image.',
            condition: (_, siblingData) => !siblingData?.isTeamMember,
          },
        },

        {
          name: 'overlayText',
          label: 'Overlay Text',
          type: 'text',
          admin: {
            description: 'This is the text that will be displayed on bottom of the image.',
          },
        },
        {
          name: 'bgColor',
          label: 'Overlay Text Background Color',
          type: 'select',
          options: [
            { label: 'Black', value: 'bg-black' },
            { label: 'White', value: 'bg-white' },
            { label: 'Beige', value: 'bg-beige' },
            { label: 'Mustard', value: 'bg-mustard' },
            { label: 'Gray', value: 'bg-gray' },
            { label: 'Rust', value: 'bg-rust' },
          ],
          defaultValue: 'bg-black',
        },
        {
          name: 'textColor',
          label: 'Overlay Text Color',
          type: 'select',
          options: [
            { label: 'White', value: 'text-white' },
            { label: 'Beige', value: 'text-beige' },
            { label: 'Black', value: 'text-black' },
            { label: 'Mustard', value: 'text-mustard' },
            { label: 'Gray', value: 'text-gray' },
            { label: 'Rust', value: 'text-rust' },
          ],
          defaultValue: 'text-white',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.overlayText),
          },
        },
      ],
    },
    {
      name: 'imageSpacing',
      label: 'Image Spacing (px)',
      type: 'number',
      defaultValue: 24,
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
        { label: 'Mustard', value: 'bg-mustard' },
        { label: 'Purple', value: 'bg-purple' },
        { label: 'Rust', value: 'bg-rust' },
        { label: 'Cream', value: 'bg-cream' },
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
