import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'status'],
    group: 'Content Management',
  },
  labels: {
    singular: 'Event Category',
    plural: 'Event Categories',
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Category Name',
      admin: {
        description: 'Name of the category',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Brief description of what this category represents',
      },
    },
  ],
  timestamps: true,
}
