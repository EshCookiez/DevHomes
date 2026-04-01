import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  generatePropertyQuerySuggestions,
  hasConfiguredPropertyQueryProvider,
} from '@/lib/property-search'

const requestSchema = z.object({
  query: z.string().trim().max(160).optional().nullable(),
  locationSlug: z.string().trim().min(1).optional().nullable(),
  count: z.number().int().min(1).max(8).optional().default(4),
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

    const suggestions = await generatePropertyQuerySuggestions(body.query ?? '', body.locationSlug ?? null, {
      count: body.count,
    })

    return NextResponse.json({
      ok: true,
      suggestions,
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

    console.error('Property query suggestions failed', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'AI suggestions are unavailable right now. Please try again later.',
      },
      { status: 500 }
    )
  }
}