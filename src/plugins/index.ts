import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
// Prefix unused imports with underscore to avoid lint errors
import { nestedDocsPlugin as _nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin as _searchPlugin } from '@payloadcms/plugin-search'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { syncFormSubmissionToBrevo } from '@/hooks/syncFormSubmissionToBrevo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { s3Storage } from '@payloadcms/storage-s3'

import { Page } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | LA VIP Tours & Charters` : 'LA VIP Tours & Charters'
}

const generateURL: GenerateURL<Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const adapter = s3Storage({
  bucket: process.env.S3_BUCKET || 'a',
  config: {
    region: process.env.S3_REGION,
  },
  collections: {
    media: {
      prefix: 'media',
      disableLocalStorage: true,
      generateFileURL: ({ filename, prefix }) => {
        // return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${prefix}/${filename}`
        return `${process.env.CLOUDFRONT_URL}/${prefix}/${filename}`
      },
    },
    exports: {
      prefix: 'exports',
      disableLocalStorage: true,
      generateFileURL: ({ filename, prefix }) => {
        return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${prefix}/${filename}`
      },
    },
  },
})

export const plugins: Plugin[] = [
  adapter,
  redirectsPlugin({
    collections: ['pages'], // 'posts' collection removed
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  // nestedDocsPlugin for categories commented out
  /*
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  */

  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
    formSubmissionOverrides: {
      hooks: {
        afterChange: [syncFormSubmissionToBrevo],
      },
    },
  }),
  // searchPlugin for posts commented out
  /*
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  */
  // Import/Export plugin for data management
  importExportPlugin({
    collections: [
      'users',
      'pages',
      'media',
      'hotels',
      'fleets',
      'events',
      'tours',
      'venues',
      'event_bookings', // Correct slug with underscores
      'event_booking_payments', // Correct slug with underscores
      'tour_bookings', // Correct slug with underscores
      'tour_booking_payments', // Correct slug with underscores
      'trusted_partners', // Correct slug with underscores
      'email-logs', // Correct slug with dashes
    ],
    // Enable download and save functionality
    // disableDownload: true, // Allow downloads
    // disableSave: true, // Allow saving exports

    // Disable jobs queue for simpler operation (can be enabled for large datasets)
    disableJobsQueue: true,

    // Override exports collection configuration
    overrideExportCollection: (collection) => ({
      ...collection,
      admin: {
        ...collection.admin,
        group: 'Data Management',
        useAsTitle: 'name',
        defaultColumns: ['name', 'format', 'collection', 'createdAt', 'updatedAt'],
        description:
          'Manage data exports - view, download, and create new exports. Files are stored in S3.',
        listSearchableFields: ['name', 'collection'],
      },
      upload: {
        ...(collection.upload || {}), // Inherit S3 configuration from adapter
        staticDir: undefined, // Use S3 instead of local storage
        adminThumbnail: 'icon', // Show file type icons instead of thumbnails
      },
    }),
  }),
  payloadCloudPlugin(),
]
