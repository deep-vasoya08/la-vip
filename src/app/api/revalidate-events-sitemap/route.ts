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

    // Revalidate the events sitemap cache
    revalidateTag('events-sitemap')

    console.log('🔄 Events sitemap revalidated via API')

    return NextResponse.json({
      revalidated: true,
      message: 'Events sitemap cache cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error revalidating events sitemap:', error)
    return NextResponse.json({ error: 'Failed to revalidate events sitemap' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Events sitemap revalidation endpoint',
    method: 'POST',
    description: 'Use POST to trigger events sitemap cache revalidation',
  })
}
