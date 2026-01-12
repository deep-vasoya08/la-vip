import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
// import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { hero } from '@/heros/config'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'
import {
  revalidatePagesSitemap,
  revalidatePagesSitemapOnDelete,
} from './hooks/revalidatePagesSitemap'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { NewsletterBlock } from '@/blocks/NewsLetter/config'
import { Rating } from '@/blocks/Rating/config'
import { InfoBlockConfig } from '@/blocks/Info/config'
import { VisualChecklistBlock } from '@/blocks/VisualChecklist/config'
import { FleetListConfig } from '@/blocks/FleetList/config'
import { CardBlock } from '@/blocks/CardBlock/config'
import { FAQBlock } from '@/blocks/FAQBlock/config'
import { DescriptionBlockConfig } from '@/blocks/DescriptionBlock/config'
import TrustedPartnerConfig from '@/blocks/TrustedPartner/config'
import { TestimonialBlockConfig } from '@/blocks/TestimonialBlock/config'
import { CustomMediaBlockConfig } from '@/blocks/CustomMediaBlock/config'
import { FeatureBlockConfig } from '@/blocks/FeatureBlock/config'
import { HotelsBlockConfig } from '@/blocks/HotelsBlock/config'
import { EventListConfig } from '@/blocks/EventList/config'
import { ToursListConfig } from '@/blocks/ToursList/config'
import { BannerBlockConfig } from '@/blocks/Banner/config'
import { HTMLBlockConfig } from '@/blocks/HTMLBlock/config'
import { LocalReviewsConfig } from '@/blocks/LocalReviews/config'
import HotelServicingConfig from '@/blocks/HotelServicingBlock/config'
import { RequestQuoteConfig } from '@/blocks/RequestQuote/config'
import { ShopperApprovedBlockConfig } from '@/blocks/ShopperApproved/config'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'pages',
          req,
        })

        return path
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                BannerBlockConfig,
                CardBlock,
                Content,
                CallToAction,
                CustomMediaBlockConfig,
                DescriptionBlockConfig,
                EventListConfig,
                FAQBlock,
                FeatureBlockConfig,
                FleetListConfig,
                FormBlock,
                HotelsBlockConfig,
                HotelServicingConfig,
                HTMLBlockConfig,
                InfoBlockConfig,
                LocalReviewsConfig,
                MediaBlock,
                NewsletterBlock,
                Rating,
                RequestQuoteConfig,
                ShopperApprovedBlockConfig,
                TestimonialBlockConfig,
                ToursListConfig,
                TrustedPartnerConfig,
                VisualChecklistBlock,
                // Archive,
              ],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          admin: {
            condition: (data) => data.enableMetadata === true,
          },
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'enableMetadata',
      type: 'checkbox',
      label: 'Enable SEO Metadata',
      defaultValue: true,
      admin: {
        description:
          'Toggle this to enable or disable SEO metadata for this page. When disabled, the page will not be indexed by search engines.',
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage, revalidatePagesSitemap],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete, revalidatePagesSitemapOnDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
