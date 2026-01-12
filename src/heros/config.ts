import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'
import { CardBlock } from '@/blocks/CardBlock/config'
import { BACKGROUND_COLOR_OPTIONS } from '@/utilities/constant'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
        {
          label: 'Home Hero',
          value: 'homeHero',
        },
        {
          label: 'Split Hero with CTA',
          value: 'splitHeroWithCTA',
        },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'missionTitle',
      type: 'text',
      label: 'Title (Like Our Mission)',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
    },
    {
      name: 'missionText',
      type: 'textarea',
      label: 'Description (Like Our Mission Description)',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
    },
    {
      name: 'missionImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Mission Image',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
    },
    {
      name: 'missionBackgroundColor',
      label: 'Mission Block Background Color',
      type: 'select',
      options: BACKGROUND_COLOR_OPTIONS,
      defaultValue: 'bg-beige',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
    },
    {
      name: 'button',
      type: 'group',
      label: 'Button',
      admin: {
        condition: (_, { type } = {}) => type === 'homeHero',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Button Text',
        },
        {
          name: 'link',
          type: 'text',
          label: 'Button Link',
        },
        {
          name: 'variant',
          type: 'select',
          label: 'Button Style',
          defaultValue: 'mustard',
          options: [
            {
              label: 'Default (White)',
              value: 'default',
            },
            {
              label: 'Mustard',
              value: 'mustard',
            },
            {
              label: 'Link',
              value: 'link',
            },
          ],
        },
        {
          name: 'size',
          type: 'select',
          label: 'Button Size',
          defaultValue: 'default',
          options: [
            {
              label: 'Default',
              value: 'default',
            },
            {
              label: 'Small',
              value: 'small',
            },
            {
              label: 'Large',
              value: 'large',
            },
          ],
        },
        {
          name: 'fullWidth',
          type: 'checkbox',
          label: 'Full Width',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) =>
          ['highImpact', 'mediumImpact', 'homeHero', 'splitHeroWithCTA'].includes(type),
      },
      relationTo: 'media',
      required: true,
    },

    // New Split Hero with CTA fields
    {
      name: 'splitHero',
      type: 'group',
      label: 'Split Hero with CTA Content',
      admin: {
        condition: (_, { type } = {}) => type === 'splitHeroWithCTA',
      },
      fields: [
        {
          name: 'heading',
          type: 'text',
          label: 'Main Title Heading',
        },
        {
          name: 'mainTitle',
          type: 'text',
          label: 'Main Title',
        },
        {
          name: 'mainSubtitle',
          type: 'text',
          label: 'Main Subtitle',
        },
        {
          name: 'mainDescription',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
                FixedToolbarFeature(),
                InlineToolbarFeature(),
              ]
            },
          }),
          label: 'Main Description',
        },

        // Fields for position and content type
        {
          name: 'contentPosition',
          type: 'select',
          label: 'Content Position',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          defaultValue: 'left',
        },
        {
          name: 'contentType',
          type: 'select',
          label: 'Content Type',
          options: [
            { label: 'Card', value: 'card' },
            { label: 'Image', value: 'image' },
            { label: 'None', value: 'none' },
          ],
          defaultValue: 'card',
        },

        // Image content (shown when contentType is 'image')
        {
          name: 'contentImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Content Image',
          admin: {
            condition: (_, { contentType } = {}) => contentType === 'image',
          },
        },
        {
          name: 'useCardBlock',
          type: 'checkbox',
          label: 'Use Card Block Component',
          defaultValue: false,
          admin: {
            condition: (_, { contentType } = {}) => contentType === 'card',
          },
        },

        // Card Block integration (only shown when useCardBlock is true)
        {
          name: 'cardBlock',
          type: 'blocks',
          blocks: [CardBlock],
          admin: {
            condition: (_, { useCardBlock, contentType } = {}) =>
              useCardBlock === true && contentType === 'card',
          },
          maxRows: 1,
        },
      ],
    },
  ],
  label: false,
}
