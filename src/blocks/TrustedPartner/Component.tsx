import { TrustedPartner, TrustedPartnerConfig } from '@/payload-types'
import TrustedPartnerClient from './Component.client'
import { getPayload } from 'payload'
import config from '@payload-config'

export const TrustedPartnerBlock: React.FC<TrustedPartnerConfig> = async ({
  heading,
  headingTextColor = 'text-black',
  subheading,
  subheadingTextColor = 'text-gray',
  selectedPartners,
}) => {
  const payload = await getPayload({ config })
  let partners: TrustedPartner[] = []

  // console.log('selectedPartners', selectedPartners)
  try {
    if (selectedPartners && Array.isArray(selectedPartners) && selectedPartners.length > 0) {
      // Extract IDs from the selectedEvent array
      const partnerIds = selectedPartners?.map((partner) =>
        typeof partner === 'object' && partner !== null ? partner.id : partner,
      )
      const result = await payload.find({
        collection: 'trusted_partners',
        sort: 'name',
        where: {
          isActive: {
            equals: true,
          },
          id: {
            in: partnerIds,
          },
        },
      })
      partners = result.docs
    } else {
      // Otherwise fetch all future events as before
      const result = await payload.find({
        collection: 'trusted_partners',
        sort: 'name',
        where: {
          isActive: {
            equals: true,
          },
        },
      })
      partners = result.docs
    }
  } catch (error) {
    console.error('Failed to fetch trusted partners:', error)
    partners = []
  }

  // Don't render if no logos to display
  // if (partners.length === 0) {
  //   return null
  // }

  return (
    <TrustedPartnerClient
      heading={heading || ''}
      headingTextColor={headingTextColor}
      subheading={subheading || ''}
      subheadingTextColor={subheadingTextColor}
      partners={partners}
    />
  )
}
