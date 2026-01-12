import type { Block } from 'payload'

export const CardBlock: Block = {
  slug: 'cardBlock',
  interfaceName: 'CardBlock',
  imageURL: '/images/block-previews/card-block.svg',
  labels: {
    singular: 'Card Block',
    plural: 'Card Blocks',
  },
  fields: [
    // {
    //   name: 'cardType',
    //   type: 'select',
    //   required: true,
    //   options: [
    //     // { label: 'Form Card', value: 'formCard' },
    //     { label: 'Info Card', value: 'infoCard' },
    //   ],
    //   defaultValue: 'infoCard',
    // },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      // admin: {
      //   condition: (_, { cardType } = {}) => cardType === 'infoCard',
      // },
    },
    {
      name: 'primaryText',
      type: 'textarea',
      label: 'Primary Text (Next to Image)',
      // admin: {
      //   condition: (_, { cardType } = {}) => cardType === 'infoCard',
      // },
    },
    {
      name: 'primaryTextColor',
      type: 'select',
      label: 'Primary Text Color',
      options: [
        { label: 'White', value: 'text-white' },
        { label: 'Beige', value: 'text-beige' },
        { label: 'Black', value: 'text-black' },
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
        { label: 'Rust', value: 'text-rust' },
      ],
      defaultValue: 'text-white',
      // admin: {
      //   condition: (_, { cardType } = {}) => cardType === 'infoCard',
      // },
    },
    {
      name: 'secondaryText',
      type: 'textarea',
      label: 'Secondary Text (Below Image)',
      admin: {
        description:
          'Use [highlight] text [/highlight] syntax to highlight specific words or phrases',
        // condition: (_, { cardType } = {}) => cardType === 'infoCard',
      },
    },
    {
      name: 'secondaryTextColor',
      type: 'select',
      label: 'Secondary Text Color',
      options: [
        { label: 'White', value: 'text-white' },
        { label: 'Beige', value: 'text-beige' },
        { label: 'Black', value: 'text-black' },
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
        { label: 'Rust', value: 'text-rust' },
      ],
      defaultValue: 'text-white',
      // admin: {
      //   condition: (_, { cardType } = {}) => cardType === 'infoCard',
      // },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      // admin: {
      //   condition: (_, { cardType } = {}) => cardType === 'infoCard',
      // },
    },
    {
      name: 'imagePosition',
      type: 'select',
      label: 'Image Position',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'left',
      // admin: {
      //   condition: (_, { cardType } = {}) => cardType === 'infoCard',
      // },
    },
    // Form Card specific fields
    // {
    //   name: 'formGroups',
    //   type: 'array',
    //   admin: {
    //     condition: (_, { cardType } = {}) => cardType === 'formCard',
    //   },
    //   fields: [
    //     {
    //       name: 'groupLabel',
    //       type: 'text',
    //       required: true,
    //     },
    //     {
    //       name: 'fields',
    //       type: 'array',
    //       fields: [
    //         {
    //           name: 'fieldType',
    //           type: 'select',
    //           required: true,
    //           options: [
    //             { label: 'Dropdown', value: 'dropdown' },
    //             { label: 'Number Input', value: 'numberInput' },
    //             { label: 'Location Picker', value: 'locationPicker' },
    //             { label: 'Date Picker', value: 'datePicker' },
    //             { label: 'Time Picker', value: 'timePicker' },
    //           ],
    //         },
    //         {
    //           name: 'label',
    //           type: 'text',
    //         },
    //         {
    //           name: 'placeholder',
    //           type: 'text',
    //         },
    //         {
    //           name: 'width',
    //           type: 'number',
    //           min: 1,
    //           max: 100,
    //           defaultValue: 100,
    //           admin: {
    //             description:
    //               'Width of the field in percentage (1-100). Fields with combined width ≤100% will appear on the same line.',
    //           },
    //         },
    //         {
    //           name: 'priceSuffix',
    //           type: 'text',
    //           admin: {
    //             condition: (_, { fieldType } = {}) => fieldType === 'numberInput',
    //           },
    //         },
    //         {
    //           name: 'options',
    //           type: 'array',
    //           admin: {
    //             condition: (_, { fieldType } = {}) => fieldType === 'dropdown',
    //           },
    //           fields: [
    //             {
    //               name: 'label',
    //               type: 'text',
    //             },
    //             {
    //               name: 'value',
    //               type: 'text',
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // },
    // Common fields
    {
      name: 'button',
      type: 'group',
      label: 'Button',
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
      name: 'backgroundColor',
      type: 'select',
      options: [
        { label: 'White', value: 'bg-white' },
        { label: 'Mustard', value: 'bg-mustard' },
      ],
      defaultValue: 'bg-white',
    },
    {
      name: 'titleColor',
      type: 'select',
      options: [
        { label: 'Mustard', value: 'text-mustard' },
        { label: 'Gray', value: 'text-gray' },
      ],
      defaultValue: 'text-mustard',
    },
  ],
  graphQL: {
    singularName: 'CardBlock',
  },
}
