// components/Footer/Component.tsx
import React from 'react'
import Link from 'next/link'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Footer, Media } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import Image from 'next/image'
import { formatPhone } from '@/utilities/textFormatting'
import { TripAdvisorWidget } from '@/components/TripAdvisorWidget'
import { ShopperApprovedBadge } from '@/components/ShopperApprovedBadge'

// Helper function to determine if a value is a Media object
const isMedia = (value: any): value is Media => {
  return typeof value === 'object' && value !== null && 'url' in value
}

export async function Footer() {
  const footerData = (await getCachedGlobal('footer', 1)()) as Footer

  return (
    <footer className="mt-auto bg-black text-white font-semplicita">
      <div className="container mx-auto py-8 px-4">
        {/* Main sections - switch from row to column on mobile */}
        <div className="flex flex-col md:flex-row md:justify-between">
          {/* Logo and Address Section */}
          <div className="flex flex-col items-center md:items-start xl:items-start mb-2">
            <Link href="/" className="mb-1">
              {footerData?.logo && isMedia(footerData.logo) ? (
                <img
                  src={footerData.logo.url || ''}
                  alt={footerData.logo.alt || 'Company Name'}
                  width={120}
                  height={40}
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                  className="h-auto"
                />
              ) : (
                <img
                  alt="Company Name"
                  width={120}
                  height={40}
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                  className="h-auto"
                  src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-logo-light.svg"
                />
              )}
            </Link>
            {footerData?.address && (
              <p className="mt-4 text-sm text-center md:text-left max-w-[230px]">
                {footerData.address}
              </p>
            )}

            <div className="mt-4 text-sm text-center md:text-left max-w-[230px] text-white">
              <ShopperApprovedBadge />
            </div>
          </div>

          {/* Contact Us Section */}
          <div className="mb-10">
            <h3 className="text-center text-lg font-medium mb-6 border-b border-gray-700 pb-1">
              CONTACT US
            </h3>
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 md:gap-12">
              {footerData?.phone && (
                <Link
                  href={`tel:${footerData.phone}`}
                  className="text-white text-sm flex flex-col items-center"
                >
                  <span className="bg-yellow-500 rounded-full p-2 mb-2 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="42"
                      height="42"
                      viewBox="0 0 57 57"
                    >
                      <g id="Group_25" data-name="Group 25" transform="translate(-817 -2652)">
                        <circle
                          id="Ellipse_17"
                          data-name="Ellipse 17"
                          cx="28.5"
                          cy="28.5"
                          r="28.5"
                          transform="translate(817 2652)"
                          fill="#ca9609"
                        />
                        <path
                          id="phone-solid"
                          d="M9.179,1.348A2.22,2.22,0,0,0,6.54.057l-4.9,1.336A2.233,2.233,0,0,0,0,3.541,24.938,24.938,0,0,0,24.936,28.478a2.233,2.233,0,0,0,2.149-1.642l1.336-4.9A2.22,2.22,0,0,0,27.13,19.3l-5.344-2.226a2.219,2.219,0,0,0-2.577.646L16.96,20.462a18.812,18.812,0,0,1-8.945-8.945l2.744-2.243A2.221,2.221,0,0,0,11.405,6.7L9.179,1.354Z"
                          transform="translate(831.25 2666.272)"
                          fill="#fdfaf4"
                        />
                      </g>
                    </svg>
                  </span>
                  {formatPhone(footerData.phone)}
                </Link>
              )}

              {footerData?.email && (
                <Link
                  href={`mailto:${footerData.email}`}
                  className="text-white text-sm flex flex-col items-center"
                >
                  <span className="bg-yellow-500 rounded-full p-2 mb-2 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="42"
                      height="42"
                      viewBox="0 0 57 57"
                    >
                      <g id="Group_26" data-name="Group 26" transform="translate(-1041 -2652)">
                        <circle
                          id="Ellipse_18"
                          data-name="Ellipse 18"
                          cx="28.5"
                          cy="28.5"
                          r="28.5"
                          transform="translate(1041 2652)"
                          fill="#ca9609"
                        />
                        <path
                          id="envelope-solid_1_"
                          data-name="envelope-solid (1)"
                          d="M2.693,64a2.693,2.693,0,0,0-1.616,4.848l12.21,9.157a1.8,1.8,0,0,0,2.155,0l12.21-9.157A2.693,2.693,0,0,0,26.035,64ZM0,70.284V81.955a3.594,3.594,0,0,0,3.591,3.591H25.137a3.594,3.594,0,0,0,3.591-3.591V70.284l-12.21,9.157a3.585,3.585,0,0,1-4.309,0Z"
                          transform="translate(1055.136 2605.727)"
                          fill="#fff"
                        />
                      </g>
                    </svg>
                  </span>
                  {footerData.email}
                </Link>
              )}

              {footerData?.faqLink && (
                <div className="flex flex-col items-center">
                  <span className="bg-yellow-500 rounded-full p-2 mb-2 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="42"
                      height="42"
                      viewBox="0 0 57 57"
                    >
                      <g id="Group_33" data-name="Group 33" transform="translate(-1130 -2609)">
                        <g id="Group_27" data-name="Group 27" transform="translate(89 -43)">
                          <circle
                            id="Ellipse_18"
                            data-name="Ellipse 18"
                            cx="28.5"
                            cy="28.5"
                            r="28.5"
                            transform="translate(1041 2652)"
                            fill="#ca9609"
                          />
                        </g>
                        <path
                          id="circle-question-regular"
                          d="M34.54,19.056A15.483,15.483,0,1,0,19.056,34.54,15.483,15.483,0,0,0,34.54,19.056ZM0,19.056A19.056,19.056,0,1,1,19.056,38.113,19.056,19.056,0,0,1,0,19.056ZM12.64,12.3a4.176,4.176,0,0,1,3.93-2.777h4.34A4.7,4.7,0,0,1,23.247,18.3l-2.4,1.377a1.787,1.787,0,0,1-3.573-.03v-1a1.783,1.783,0,0,1,.9-1.548l3.3-1.891a1.124,1.124,0,0,0-.558-2.1H16.57a.586.586,0,0,0-.558.395l-.03.089A1.785,1.785,0,1,1,12.617,12.4l.03-.089Zm4.035,13.9a2.382,2.382,0,1,1,2.382,2.382A2.382,2.382,0,0,1,16.674,26.2Z"
                          transform="translate(1139.156 2618.731)"
                          fill="#fff"
                        />
                      </g>
                    </svg>
                  </span>
                  <CMSLink {...footerData.faqLink.link} className="text-white text-sm" />
                </div>
              )}
            </div>
          </div>

          {/* Follow Us Section */}
          <div className="mb-10">
            <h3 className="text-center text-lg font-medium mb-6 border-b border-gray-700 pb-1">
              FOLLOW US
            </h3>
            <div className="grid grid-cols-4 gap-0 max-w-[10rem] mx-auto">
              {footerData?.socialLinks?.map((social, index) => (
                <Link
                  key={index}
                  href={social.url || '#'}
                  target={social.newTab ? '_blank' : '_self'}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black p-1 w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
                  aria-label={social.label || `Social link ${index + 1}`}
                >
                  {social.icon && isMedia(social.icon) ? (
                    <Image
                      src={social.icon.url || ''}
                      alt={social.label || `Social platform ${index + 1}`}
                      width={32}
                      height={32}
                      loading="lazy"
                      fetchPriority="low"
                      decoding="async"
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10" />
                  )}
                </Link>
              ))}
              {/* TripAdvisor Widget */}
              <TripAdvisorWidget />
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="text-center text-xs pt-6 flex flex-col md:flex-row md:justify-between items-center">
          <p className="font-thin">
            ©{new Date().getFullYear()} LA VIP Tours & Charters. All Rights Reserved.
          </p>
          <div className="hidden sm:flex justify-center mt-2 space-x-3 order-3 md:order-2">
            {footerData?.legalLinks?.map((link, index) => (
              <CMSLink key={index} {...link.link} className="text-white hover:text-yellow-400" />
            ))}
            <CMSLink
              key="termly-display-preferences"
              url="#"
              className="uppercase termly-display-preferences"
              label="Consent Preferences"
            />
          </div>

          {footerData?.websiteCredit && (
            <p className="mt-2 order-2 md:order-3">
              Website by{' '}
              <Link
                href={footerData.websiteCreditUrl || '#'}
                className="text-yellow-400"
                target="_blank"
              >
                {footerData.websiteCredit}
              </Link>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
