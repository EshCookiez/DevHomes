/**
 * Backend Proxy for Single Article Endpoint
 * 
 * GET /api/v1/news/articles/:identifier
 * 
 * :identifier can be either:
 * - Article slug (e.g., "philippines-joins-regional-tourism-drive")
 * - UUID (e.g., "218ffda0-6df7-497e-95b3-09ffbd1c9d68")
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASEURL =
  process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'https://homesphnews-api-394504332858.asia-southeast1.run.app/api'
const API_KEY = process.env.HOMESPH_NEWS_API_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params

    if (!identifier) {
      return NextResponse.json(
        { error: 'Article identifier required' },
        { status: 400 }
      )
    }

    console.log(`[News Proxy] Fetching article by identifier: ${identifier}`)
    console.log(`[News Proxy] API_BASEURL: ${API_BASEURL}`)
    console.log(`[News Proxy] API_KEY present: ${!!API_KEY}`)

    // Build external API URL
    const externalUrl = `${API_BASEURL}/external/articles/${identifier}`

    console.log(`[News Proxy] Calling external API: ${externalUrl}`)

    // Make request to external API with secure headers
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'X-Site-Key': API_KEY,
        'Accept': 'application/json',
      },
    })

    console.log(`[News Proxy] Response status: ${response.status}`)

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[News Proxy] Article not found: ${identifier}`)
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        )
      }
      console.error(`[News Proxy] External API error: ${response.status}`)
      return NextResponse.json(
        { error: 'Failed to fetch article from news provider' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`[News Proxy] ✓ Got article: ${data.article?.title || 'Unknown'}`)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[News Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
