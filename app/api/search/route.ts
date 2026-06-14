import { NextRequest, NextResponse } from 'next/server'
import { searchProductsByName } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchProductsByName(q, 8)
    return NextResponse.json(
      { results },
      {
        headers: {
          // Cache search results for 5 minutes
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (err) {
    console.error('[/api/search]', err)
    return NextResponse.json({ results: [] })
  }
}
