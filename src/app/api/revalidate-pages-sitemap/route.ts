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

    // Revalidate the pages sitemap cache
    revalidateTag('pages-sitemap')

    console.log('🔄 Pages sitemap revalidated via API')

    return NextResponse.json({
      revalidated: true,
      message: 'Pages sitemap cache cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error revalidating pages sitemap:', error)
    return NextResponse.json({ error: 'Failed to revalidate pages sitemap' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Pages sitemap revalidation endpoint',
    method: 'POST',
    description: 'Use POST to trigger pages sitemap cache revalidation',
  })
}
