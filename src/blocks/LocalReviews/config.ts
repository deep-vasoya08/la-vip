import type { Block } from 'payload'

export const LocalReviewsConfig: Block = {
  slug: 'localReviews',
  interfaceName: 'LocalReviewsConfig',
  imageURL: '/images/block-previews/local-reviews-block.svg',
  labels: {
    singular: 'Local Reviews Block',
    plural: 'Local Reviews Blocks',
  },
  fields: [
    {
      name: 'widgetId',
      type: 'text',
      label: 'Widget ID',
      admin: {
        description:
          'Enter the LocalReviews widget ID (e.g., 39235046-b56d-419d-b6b4-dd3d4b849984)',
      },
      defaultValue: '39235046-b56d-419d-b6b4-dd3d4b849984',
      required: true,
    },
  ],
}
