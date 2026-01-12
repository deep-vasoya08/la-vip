import { revalidateTag, revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Revalidate all important cache tags
    revalidateTag('global_header')
    revalidateTag('global_footer')
    revalidateTag('pages-sitemap')
    revalidateTag('posts-sitemap')
    revalidateTag('pages-content') // Revalidate dynamic page content
    revalidateTag('global_meta_information')
    revalidateTag('global_navigation')
    revalidateTag('global_settings')
    revalidateTag('home_page') // Add specific tag for home page
    revalidateTag('dashboard') // Add specific tag for dashboard

    // Revalidate root path with layout option to clear complete layout cache
    revalidatePath('/', 'layout')

    // Force revalidate with page option explicitly
    revalidatePath('/', 'page')

    // Specifically revalidate the dashboard page
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard', 'page')

    return NextResponse.json({
      revalidated: true,
      message: 'Cache successfully revalidated',
      date: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        message: 'Error revalidating cache',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
