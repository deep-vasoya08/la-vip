import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { HTMLBlockComponent } from '@/blocks/HTMLBlock/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { Newsletter } from './NewsLetter/Component'
import RatingBlock from './Rating/Component'
import InfoBlock from './Info/Component'
import VisualChecklist from './VisualChecklist/Component'
import { FleetList } from './FleetList/Component'
import CardComponent from './CardBlock/Component'
import FAQComponent from './FAQBlock/Component'
import DescriptionBlock from './DescriptionBlock/Component'
import { TrustedPartnerBlock } from './TrustedPartner/Component'
import TestimonialBlock from './TestimonialBlock/Component'
import CustomMediaBlock from './CustomMediaBlock/Component'
import FeatureBlock from './FeatureBlock/Component'
import { HotelsBlock } from './HotelsBlock/Component'
import { EventList } from './EventList/Component'
import { ToursList } from './ToursList/Component'
import { BannerBlock } from './Banner/Component'
import { HotelServicingBlock } from './HotelServicingBlock/Component'
import { LocalReviewsBlock } from './LocalReviews/Component'
import { RequestQuoteBlock } from './RequestQuote/Component'
import { ShopperApprovedBlock } from './ShopperApproved/Component'

const blockComponents = {
  bannerBlock: BannerBlock,
  cardBlock: CardComponent,
  content: ContentBlock,
  cta: CallToActionBlock,
  customMediaBlock: CustomMediaBlock,
  descriptionBlock: DescriptionBlock,
  eventList: EventList,
  htmlBlock: HTMLBlockComponent,
  faqBlock: FAQComponent,
  featureBlock: FeatureBlock,
  fleetList: FleetList,
  formBlock: FormBlock,
  hotelServicing: HotelServicingBlock,
  hotelsBlock: HotelsBlock,
  infoBlock: InfoBlock,
  localReviews: LocalReviewsBlock,
  requestQuote: RequestQuoteBlock,
  mediaBlock: MediaBlock,
  newsletter: Newsletter,
  shopperApprovedBlock: ShopperApprovedBlock,
  ratingBlock: RatingBlock,
  testimonialBlock: TestimonialBlock,
  toursList: ToursList,
  trustedPartner: TrustedPartnerBlock,
  vcBlock: VisualChecklist,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
