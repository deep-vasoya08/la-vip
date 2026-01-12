import type { Metadata } from 'next'
import { cn } from '@/utilities/ui'
import React from 'react'
import Script from 'next/script'

// import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
// import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { roboto, semplicita } from './fonts'

import { HeaderWrapper } from '@/components/HeaderWrapper'
import { FooterWrapper } from '@/components/FooterWrapper'
import { LiveAgentWidget } from '@/components/LiveAgentWidget'
import { TermlyCMP } from '@/components/TermlyCMP'
import { MetaPixelScript } from '@/components/MetaPixelScript'
import NextTopLoader from 'nextjs-toploader'
export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // const { isEnabled } = await draftMode()

  return (
    <html className={cn(semplicita.variable, roboto.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-T889CG9M');
            `,
          }}
        />
        {/* End Google Tag Manager */}
        {/* Meta Pixel */}
        <MetaPixelScript />
        {/* End Meta Pixel */}
      </head>
      <body suppressHydrationWarning={true}>
        <NextTopLoader color="#ca9609" showSpinner={false} height={4} />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T889CG9M"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Script
          src="https://cdn.userway.org/widget.js"
          data-account="LCboSx7nJb"
          strategy="beforeInteractive"
        />
        <Providers>
          {/* <AdminBar
            adminBarProps={{
              preview: false,
            }}
          /> */}
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          {children}
          <FooterWrapper>
            <Footer />
          </FooterWrapper>
          <LiveAgentWidget />
          <TermlyCMP />
        </Providers>
      </body>
    </html>
  )
}
