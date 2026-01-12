import React from 'react'
import { FleetListClient } from './Component.client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { FleetListConfig, Fleet } from '@/payload-types'

export const FleetList: React.FC<FleetListConfig> = async ({
  title = 'OUR FLEET',
  description = 'Explore our luxury fleet of vehicles for your next trip',
  limit = 6,
  ctaText = 'Book Now',
  ctaUrl = '#',
  backgroundColor,
  selectedFleets,
}) => {
  let fleets = selectedFleets
  const payload = await getPayload({ config: configPromise })
  if (!selectedFleets) {
    const fetchedFleets = await payload.find({
      collection: 'fleets',
      depth: 2,
      limit: limit || 10,
      sort: 'createdAt',
    })
    fleets = fetchedFleets.docs
  } else {
    // Get the order of IDs from selectedFleets to maintain admin panel order
    const selectedIds = selectedFleets.map((fleet) =>
      typeof fleet === 'number' ? fleet : fleet.id,
    )

    // Fetch all fleets that match the selected IDs
    const fetchedFleets = await payload.find({
      collection: 'fleets',
      depth: 2,
      where: {
        id: {
          in: selectedIds,
        },
      },
    })

    // Sort the fetched fleets to match the order from selectedFleets
    const fleetMap = new Map(fetchedFleets.docs.map((fleet) => [fleet.id, fleet]))
    fleets = selectedIds
      .map((id) => fleetMap.get(id))
      .filter((fleet): fleet is Fleet => fleet !== undefined)
  }

  // console.log('server fleets', fleets)
  return (
    <FleetListClient
      blockType="fleetList"
      title={title}
      description={description}
      limit={limit}
      ctaText={ctaText}
      ctaUrl={ctaUrl}
      backgroundColor={backgroundColor}
      fleets={fleets || []}
      selectedFleets={selectedFleets}
    />
  )
}
