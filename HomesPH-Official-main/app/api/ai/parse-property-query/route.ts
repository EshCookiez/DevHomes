import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildPropertySearchUrl,
  hasConfiguredPropertyQueryProvider,
  parseNaturalLanguagePropertyQuery,
} from '@/lib/property-search'

const requestSchema = z.object({
  query: z.string().trim().min(1, 'A search query is required.'),
  locationSlug: z.string().trim().min(1).optional().nullable(),
  fallbackMode: z.enum(['buy', 'rent']).optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json())

    if (!hasConfiguredPropertyQueryProvider()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'AI search is not configured yet. Add OPENAI_API_KEY or GEMINI_API_KEY to HomesPH-Official/.env or .env.local, then restart the Next.js dev server.',
        },
        { status: 503 }
      )
    }

    const parsedQuery = await parseNaturalLanguagePropertyQuery(
      body.query,
      body.locationSlug ?? null
    )

    if (parsedQuery.mode === 'unknown') {
      if (body.fallbackMode) {
        return NextResponse.json({
          ok: true,
          parsedQuery,
          redirectUrl: buildPropertySearchUrl(body.fallbackMode, parsedQuery, {
            locationSlug: body.locationSlug ?? null,
            aiQuery: body.query,
          }),
        })
      }

      return NextResponse.json({
        ok: true,
        parsedQuery,
        redirectUrl: null,
        clarification: {
          message: 'Should we search Homes.ph listings under Buy or Rent for this request?',
          buyUrl: buildPropertySearchUrl('buy', parsedQuery, {
            locationSlug: body.locationSlug ?? null,
            aiQuery: body.query,
          }),
          rentUrl: buildPropertySearchUrl('rent', parsedQuery, {
            locationSlug: body.locationSlug ?? null,
            aiQuery: body.query,
          }),
        },
      })
    }

    return NextResponse.json({
      ok: true,
      parsedQuery,
      redirectUrl: buildPropertySearchUrl(parsedQuery.mode, parsedQuery, {
        locationSlug: body.locationSlug ?? null,
        aiQuery: body.query,
      }),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.issues[0]?.message ?? 'Invalid request.',
        },
        { status: 400 }
      )
    }

    console.error('Property query parsing failed', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'AI parsing is unavailable right now. Please try again or use Manual Mode.',
      },
      { status: 500 }
    )
  }
}
