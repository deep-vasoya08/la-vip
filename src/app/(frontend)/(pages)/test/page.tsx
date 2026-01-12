import type { Metadata } from 'next'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Style Guide | LA VIP Tours',
    description:
      'LA VIP Tours design system and style guide showcasing typography, colors, and component styling for the website.',
    keywords: [
      'LA VIP Tours style guide',
      'design system',
      'typography',
      'color palette',
      'web design',
      'brand guidelines',
      'UI components',
      'visual design',
      'website styling',
      'brand identity',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Style Guide | LA VIP Tours',
      description:
        'LA VIP Tours design system and style guide showcasing typography, colors, and styling.',
      type: 'website',
      url: '/test',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Style Guide',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Style Guide | LA VIP Tours',
      description: 'LA VIP Tours design system and style guide.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Style Guide',
        },
      ],
    },
    alternates: {
      canonical: '/test',
    },
    robots: {
      index: false, // Test/style guide pages shouldn't be indexed
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}

export default function Test() {
  return (
    <div className="p-12">
      <div className="max-w-screen-2xl mx-auto items-center">
        <h1>H1 Heading - Semplicita Pro Bold (60/70px)</h1>
        <h2>H2 Heading - Semplicita Pro Bold (40/48px)</h2>
        <h3>H3 Heading - Semplicita Pro Bold (36/48px)</h3>
        <h4>H4 Heading - Semplicita Pro Bold (30/36px)</h4>
        <h5>H5 Heading - Semplicita Pro Bold (24/32px)</h5>
        <h6>H6 Heading - Semplicita Pro Bold (20/28px)</h6>

        <blockquote className="my-8">This is a blockquote using Roboto Italic font</blockquote>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          <div className="p-4 bg-light-gray text-black">Light Gray: #F8F8F8</div>
          <div className="p-4 bg-light-beige text-black">Light Beige: #F7F3E3</div>
          <div className="p-4 bg-beige text-black">Beige: #EFE9D7</div>
          <div className="p-4 bg-gray text-white">Gray: #474747</div>
          <div className="p-4 bg-yellow">Yellow: #FFCF56</div>
          <div className="p-4 bg-mustard text-white">Mustard: #DBA506</div>
          <div className="p-4 bg-rust text-white">Rust: #D96E27</div>
        </div>

        <div className="mt-8">
          <button className="bg-yellow text-gray font-semplicita py-2 px-4 rounded mr-4">
            Yellow Button
          </button>
          <button className="bg-rust text-white font-semplicita py-2 px-4 rounded mr-4">
            Rust Button
          </button>
          <button className="bg-gray text-white font-semplicita py-2 px-4 rounded">
            Gray Button
          </button>
        </div>

        <div className="mt-8">
          <p className="text-body-mobile md:text-body-desktop">
            This is body text that should be sized correctly on mobile and desktop. Lorem ipsum
            dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies
            ultrices, nunc nisl aliquet nunc, vitae aliquam nisl nunc vitae nisl.
          </p>
        </div>
      </div>
    </div>
  )
}
