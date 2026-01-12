import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = request.headers.get('authorization')
    if (
      process.env.REVALIDATION_TOKEN &&
      authHeader !== `Bearer ${process.env.REVALIDATION_TOKEN}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Revalidate all sitemap caches
    revalidateTag('pages-sitemap')
    revalidateTag('events-sitemap')
    revalidateTag('tours-sitemap')

    console.log('🔄 All sitemaps revalidated via API')

    return NextResponse.json({
      revalidated: true,
      message: 'All sitemap caches cleared successfully',
      sitemaps: ['pages-sitemap', 'events-sitemap', 'tours-sitemap'],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error revalidating all sitemaps:', error)
    return NextResponse.json({ error: 'Failed to revalidate sitemaps' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'All sitemaps revalidation endpoint',
    method: 'POST',
    description: 'Use POST to trigger all sitemap cache revalidation',
    sitemaps: ['pages-sitemap', 'events-sitemap', 'tours-sitemap'],
  })
}
