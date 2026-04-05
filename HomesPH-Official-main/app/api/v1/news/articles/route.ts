/**
 * Backend Proxy for External News API
 * 
 * This route acts as a secure proxy between the frontend and the external HomesPhNews API.
 * The API key is kept in the backend environment and never exposed to the client.
 * 
 * Frontend calls this endpoint instead of calling the external API directly.
 * This prevents API key exposure in browser Network tabs.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_BASEURL =
  process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'https://homesphnews-api-394504332858.asia-southeast1.run.app/api'
const API_KEY = process.env.HOMESPH_NEWS_API_KEY || ''

/**
 * GET /api/v1/news/articles
 * 
 * Query Parameters (passed through to external API):
 * - search: text search
 * - category_slug: category filter
 * - country_slug: country filter
 * - city_slug: city filter
 * - topic: topic filter
 * - page: page number
 * - per_page: results per page
 */
export async function GET(request: NextRequest) {
  console.log('[News Proxy] ===== PROXY ROUTE CALLED =====')
  try {
    // Log configuration for debugging
    const hasApiKey = !!API_KEY && API_KEY.length > 0
    console.log('[News Proxy] API Config:')
    console.log(`  - Base URL: ${API_BASEURL}`)
    console.log(`  - API Key present: ${hasApiKey ? 'YES ✓' : 'NO ✗'} (${API_KEY?.length || 0} chars)`)
    if (API_KEY) {
      console.log(`  - API Key starts with: ${API_KEY.substring(0, 10)}...`)
    }
    console.log(`  - Environment Var NEXT_PUBLIC_EXTERNAL_API_URL: ${process.env.NEXT_PUBLIC_EXTERNAL_API_URL}`)
    console.log(`  - Environment Var HOMESPH_NEWS_API_KEY present: ${process.env.HOMESPH_NEWS_API_KEY ? 'YES' : 'NO'}`)

    if (!hasApiKey) {
      const errorMsg = 'API_KEY is missing from environment or .env'
      console.error(`[News Proxy] CRITICAL: ${errorMsg}`)
      return NextResponse.json(
        { error: errorMsg, details: 'HOMESPH_NEWS_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Get query parameters from frontend request
    const searchParams = request.nextUrl.searchParams
    const externalParams = new URLSearchParams()

    // Forward relevant parameters to external API
    const paramNames = [
      'search',
      'q',
      'category_slug',
      'category',
      'country_slug',
      'country',
      'province_slug',
      'province',
      'city_slug',
      'city',
      'topic',
      'per_page',
      'limit',
      'page',
    ]

    for (const param of paramNames) {
      const value = searchParams.get(param)
      if (value) {
        externalParams.append(param, value)
      }
    }

    // Build external API URL
    const externalUrl = new URL(`${API_BASEURL}/external/articles`)
    externalUrl.search = externalParams.toString()

    console.log(`[News Proxy] Calling external API: ${externalUrl.toString()}`)
    console.log(`[News Proxy] Using header X-Site-Key: ${API_KEY.substring(0, 10)}...`)

    // Make request to external API with secure headers
    const response = await fetch(externalUrl.toString(), {
      method: 'GET',
      headers: {
        'X-Site-Key': API_KEY,
        'Accept': 'application/json',
      },
    })

    console.log(`[News Proxy] Response status from external API: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[News Proxy] API Error ${response.status}:`, errorText.substring(0, 200))
      return NextResponse.json(
        { error: `News API returned ${response.status}`, details: errorText.substring(0, 500) },
        { status: response.status }
      )
    }

    const data = await response.json()
    const articleCount = data.data?.data?.length || 0
    console.log(`[News Proxy] ✓ Success: Got ${articleCount} articles from external API`)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[News Proxy] CATCH ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
