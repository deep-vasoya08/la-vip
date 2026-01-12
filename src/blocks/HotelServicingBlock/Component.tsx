import { Hotel, HotelServicingConfig } from '@/payload-types'
import { getPayload } from 'payload'
import config from '@payload-config'
import HotelServicingClient from './Component.client'

export const HotelServicingBlock: React.FC<HotelServicingConfig> = async ({
  heading,
  headingTextColor = 'text-black',
  subheading,
  subheadingTextColor = 'text-gray',
  selectedHotels,
}) => {
  const payload = await getPayload({ config })
  let hotels: Hotel[] = []

  const currentDate = new Date()

  try {
    if (selectedHotels && Array.isArray(selectedHotels) && selectedHotels.length > 0) {
      // Extract IDs from the selectedHotels array
      const hotelIds = selectedHotels?.map((hotel) =>
        typeof hotel === 'object' && hotel !== null ? hotel.id : hotel,
      )
      // Now apply the date filter
      const result = await payload.find({
        collection: 'hotels',
        where: {
          id: {
            in: hotelIds,
          },
          or: [
            {
              partnerValidTill: {
                greater_than: currentDate.toISOString(),
              },
            },
            {
              partnerValidTill: {
                exists: false,
              },
            },
          ],
        },
      })
      hotels = result.docs
    } else {
      // Now apply the date filter - include hotels with no expiry date or future expiry
      const result = await payload.find({
        collection: 'hotels',
        where: {
          or: [
            {
              partnerValidTill: {
                greater_than: currentDate.toISOString(),
              },
            },
            {
              partnerValidTill: {
                exists: false,
              },
            },
          ],
        },
      })

      hotels = result.docs
    }
  } catch (error) {
    console.error('Failed to fetch hotels:', error)
    hotels = []
  }

  // Don't render if no hotels to display
  // if (hotels.length === 0) {
  //   return null
  // }

  return (
    <HotelServicingClient
      heading={heading || ''}
      headingTextColor={headingTextColor}
      subheading={subheading || ''}
      subheadingTextColor={subheadingTextColor}
      hotels={hotels}
    />
  )
}
