import { Block } from 'payload'

export const ShopperApprovedBlockConfig: Block = {
  slug: 'shopperApprovedBlock',
  interfaceName: 'ShopperApprovedBlockConfig',
  imageURL: '/images/block-previews/shopper-approved-block.svg',
  labels: {
    singular: 'Shopper Approved Review Block',
    plural: 'Shopper Approved Review Blocks',
  },
  fields: [
    {
      name: 'autoLoad',
      label: 'Auto Load Script',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Automatically load the ShopperApproved script when the component mounts',
      },
    },
  ],
}
