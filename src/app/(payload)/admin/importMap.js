import { RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { FixedToolbarFeatureClient as FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ParagraphFeatureClient as ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UnderlineFeatureClient as UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ItalicFeatureClient as ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ExportListMenuItem as ExportListMenuItem_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'
import { ExportSaveButton as ExportSaveButton_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'
import { HeadingFeatureClient as HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { OverviewComponent as OverviewComponent_a8a977ebc872c5d5ea7ee689724c0860 } from '@payloadcms/plugin-seo/client'
import { MetaTitleComponent as MetaTitleComponent_a8a977ebc872c5d5ea7ee689724c0860 } from '@payloadcms/plugin-seo/client'
import { MetaImageComponent as MetaImageComponent_a8a977ebc872c5d5ea7ee689724c0860 } from '@payloadcms/plugin-seo/client'
import { MetaDescriptionComponent as MetaDescriptionComponent_a8a977ebc872c5d5ea7ee689724c0860 } from '@payloadcms/plugin-seo/client'
import { PreviewComponent as PreviewComponent_a8a977ebc872c5d5ea7ee689724c0860 } from '@payloadcms/plugin-seo/client'
import { SlugComponent as SlugComponent_92cc057d0a2abb4f6cf0307edf59f986 } from '@/fields/slug/SlugComponent'
import { default as default_05fbc03b26cd9933862eb9222b22001f } from '@/fields/rruleField'
import { default as default_6a1377d0786df9d8973ab78b5b390a57 } from '@/components/customAdminEventBooking/EventScheduleSelector'
import { default as default_e0c62f129ee5716fe025ea6c0d3eafab } from '@/components/customAdminEventBooking/PickupLocationSelector'
import { default as default_309fc3fbd28c3e71352ba7b086bfa485 } from '@/components/customAdminEventBooking/PickupTimeSelector'
import { default as default_dfbc766c772e812f55fb663d730224bd } from '@/components/EventBookingsList'
import { default as default_053ce78306a0db2ca0a4da24db5d8a44 } from '@/components/TourBookingsList'
import { SortBy as SortBy_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'
import { FieldsToExport as FieldsToExport_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'
import { CollectionField as CollectionField_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'
import { WhereField as WhereField_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'
import { Preview as Preview_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'
import { RowLabel as RowLabel_ec255a65fa6fa8d1faeb09cf35284224 } from '@/Header/RowLabel'
import { RowLabel as RowLabel_1f6ff6ff633e3695d348f4f3c58f1466 } from '@/Footer/RowLabel'
import { default as default_1a7510af427896d367a49dbf838d2de6 } from '@/components/BeforeDashboard'
import { default as default_8a7ab0eb7ab5c511aba12e68480bfe5e } from '@/components/BeforeLogin'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { ImportExportProvider as ImportExportProvider_cdf7e044479f899a31f804427d568b36 } from '@payloadcms/plugin-import-export/rsc'

export const importMap = {
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient": InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient": FixedToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#ParagraphFeatureClient": ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UnderlineFeatureClient": UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#BoldFeatureClient": BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#ItalicFeatureClient": ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/plugin-import-export/rsc#ExportListMenuItem": ExportListMenuItem_cdf7e044479f899a31f804427d568b36,
  "@payloadcms/plugin-import-export/rsc#ExportSaveButton": ExportSaveButton_cdf7e044479f899a31f804427d568b36,
  "@payloadcms/richtext-lexical/client#HeadingFeatureClient": HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/plugin-seo/client#OverviewComponent": OverviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
  "@payloadcms/plugin-seo/client#MetaTitleComponent": MetaTitleComponent_a8a977ebc872c5d5ea7ee689724c0860,
  "@payloadcms/plugin-seo/client#MetaImageComponent": MetaImageComponent_a8a977ebc872c5d5ea7ee689724c0860,
  "@payloadcms/plugin-seo/client#MetaDescriptionComponent": MetaDescriptionComponent_a8a977ebc872c5d5ea7ee689724c0860,
  "@payloadcms/plugin-seo/client#PreviewComponent": PreviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
  "@/fields/slug/SlugComponent#SlugComponent": SlugComponent_92cc057d0a2abb4f6cf0307edf59f986,
  "@/fields/rruleField#default": default_05fbc03b26cd9933862eb9222b22001f,
  "@/components/customAdminEventBooking/EventScheduleSelector#default": default_6a1377d0786df9d8973ab78b5b390a57,
  "@/components/customAdminEventBooking/PickupLocationSelector#default": default_e0c62f129ee5716fe025ea6c0d3eafab,
  "@/components/customAdminEventBooking/PickupTimeSelector#default": default_309fc3fbd28c3e71352ba7b086bfa485,
  "@/components/EventBookingsList#default": default_dfbc766c772e812f55fb663d730224bd,
  "@/components/TourBookingsList#default": default_053ce78306a0db2ca0a4da24db5d8a44,
  "@payloadcms/plugin-import-export/rsc#SortBy": SortBy_cdf7e044479f899a31f804427d568b36,
  "@payloadcms/plugin-import-export/rsc#FieldsToExport": FieldsToExport_cdf7e044479f899a31f804427d568b36,
  "@payloadcms/plugin-import-export/rsc#CollectionField": CollectionField_cdf7e044479f899a31f804427d568b36,
  "@payloadcms/plugin-import-export/rsc#WhereField": WhereField_cdf7e044479f899a31f804427d568b36,
  "@payloadcms/plugin-import-export/rsc#Preview": Preview_cdf7e044479f899a31f804427d568b36,
  "@/Header/RowLabel#RowLabel": RowLabel_ec255a65fa6fa8d1faeb09cf35284224,
  "@/Footer/RowLabel#RowLabel": RowLabel_1f6ff6ff633e3695d348f4f3c58f1466,
  "@/components/BeforeDashboard#default": default_1a7510af427896d367a49dbf838d2de6,
  "@/components/BeforeLogin#default": default_8a7ab0eb7ab5c511aba12e68480bfe5e,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@payloadcms/plugin-import-export/rsc#ImportExportProvider": ImportExportProvider_cdf7e044479f899a31f804427d568b36
}
