import type { Hotel, HotelsBlockConfig } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Image from 'next/image'
import React from 'react'

export const HotelsBlock = async (props: HotelsBlockConfig) => {
  const { limit: limitFromProps } = props

  const limit = limitFromProps || 3

  let hotels: Hotel[] = []
  const payload = await getPayload({ config: configPromise })
  const fetchedHotels = await payload.find({
    collection: 'hotels',
    depth: 1,
    limit,
  })
  hotels = fetchedHotels.docs

  return (
    <div className="overflow-x-auto bg-beige">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-beige">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider text-black"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider text-black"
            >
              Location
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider text-black"
            >
              Rating
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider text-black"
            >
              Description
            </th>
          </tr>
        </thead>
        <tbody className="bg-beige divide-y divide-gray-200">
          {hotels.map((hotel) => (
            <tr key={hotel.id} className="hover:bg-beige">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {hotel.images && typeof hotel.images === 'object' && (
                    <div className="flex-shrink-0 h-10 w-10 mr-4">
                      <Image
                        className="rounded-full object-cover"
                        src={hotel.images?.url || ''}
                        alt={hotel.name || 'Hotel image'}
                        width={40}
                        height={40}
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="text-sm font-medium text-black">{hotel.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-black">{hotel.location}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-black">{hotel.rating ? `${hotel.rating}` : 'N/A'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-black line-clamp-2">
                  {hotel.description || 'No description available'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
