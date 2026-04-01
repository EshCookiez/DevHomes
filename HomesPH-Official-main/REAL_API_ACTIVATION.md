# Real News API - Setup & Activation

> **Status**: Application is configured to use ONLY real HomesPhNews API data. Mock data has been completely removed.

## What Changed

✅ **Removed all mock data fallbacks** - App now requires real API  
✅ **API-only mode** - No fallback to MOCK_NEWS, MOCK_OFW_NEWS, MOCK_REAL_ESTATE_NEWS  
✅ **Error handling improved** - Clear error messages if API isn't working

## Current Issue: Missing API Key

The application will show **"No articles found"** until you provide:

1. **API Key** (`HOMESPH_NEWS_API_KEY`)
2. **API Endpoint** (should already be configured)

## Setup Steps

### Step 1: Obtain API Credentials

Contact HomesPhNews and request:
- **Partner API Key** (for `X-Site-Key` header)
- **API Endpoint** (if different from current configuration)

### Step 2: Update `.env`

Replace the placeholder with your real API key:

```bash
# .env (or .env.local for local development)

# API Endpoint (public, safe to commit)
NEXT_PUBLIC_EXTERNAL_API_URL=https://homesphnews-api-394504332858.asia-southeast1.run.app/api

# API Key (NEVER commit this file to public repos)
# Keep this secret - only in .env.local or deployment secrets
HOMESPH_NEWS_API_KEY=your_actual_partner_api_key_here
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart with:
npm run dev
```

### Step 4: Verify It Works

Visit `http://localhost:3000/news` and check:

1. ✅ **Articles display** - Real articles from HomesPhNews API
2. ✅ **No console errors** - Check browser console for any issues  
3. ✅ **Network tab** - Should show `/api/v1/news/articles` (backend proxy), NOT external API directly
4. ✅ **No API key exposed** - Network tab should never show API key

---

## How the Real API Integration Works

```
Frontend (/news)
    ↓
getArticles() from lib/hybrid-articles.ts
    ↓
fetch('/api/v1/news/articles?...')  ← Backend proxy
    ↓
Backend route: app/api/v1/news/articles/route.ts
    ↓
Adds X-Site-Key: HOMESPH_NEWS_API_KEY (kept secret!)
    ↓
External HomesPhNews API
    ↓
Returns: { data: { data: [...], current_page, total, ... } }
    ↓
Frontend renders articles
```

**Security Note**: Your API key is never exposed to the browser. All requests go through your own backend proxy.

---

## Expected API Response Format

The backend expects this format from HomesPhNews API:

```json
{
  "data": {
    "data": [
      {
        "id": "123",
        "slug": "article-title",
        "title": "Article Title",
        "summary": "Short summary",
        "description": "Full description",
        "category": "Real Estate",
        "image": "https://...",
        "published_at": "2026-04-01T00:00:00Z",
        "author": "John Doe",
        "views_count": 100,
        "topics": ["property", "manila"],
        "location": "Manila",
        "city_name": "Manila"
      }
    ],
    "current_page": 1,
    "per_page": 20,
    "total": 250,
    "last_page": 25
  }
}
```

If the API response format differs, update the mapping in:
- **File**: `app/news/page.tsx`  
- **Function**: `getArticles()` (lines ~390-415)

---

## Troubleshooting

### Problem: "No articles found"
**Cause**: API key is missing or invalid

**Solution**:
1. Verify `HOMESPH_NEWS_API_KEY` in `.env` is set to real key
2. Check that the key isn't just the placeholder text
3. Restart dev server after updating .env

### Problem: 404 Error from API Proxy
**Cause**: API endpoint is wrong or API key is invalid

**Solution**:
1. Verify `NEXT_PUBLIC_EXTERNAL_API_URL` is correct
2. Verify `HOMESPH_NEWS_API_KEY` matches what HomesPhNews provided
3. Check backend proxy logs: `console.log('[NewsAPI]...')`

### Problem: Articles show but are incomplete
**Cause**: API response format doesn't match expected format

**Solution**:
1. Check the actual API response in Network tab
2. Compare with expected format above
3. Update field mapping in `app/news/page.tsx` if needed

---

## Components Using Real API

These components now pull from real API (no mock data):

- ✅ [app/news/page.tsx](app/news/page.tsx) - Main news page
- ✅ [components/news/RealEstateNewsSection.tsx](components/news/RealEstateNewsSection.tsx)  
- ✅ [components/news/OFWNewsSection.tsx](components/news/OFWNewsSection.tsx)
- ✅ [components/news/PhilippineTourismSection.tsx](components/news/PhilippineTourismSection.tsx)
- ✅ [app/article/[slug]/page.tsx](app/article/[slug]/page.tsx)

---

## Mock Data Location (For Reference)

Mock data files are still in the codebase but NOT used anymore:
- `lib/mock-data.ts` - Contains MOCK_NEWS, MOCK_OFW_NEWS, MOCK_REAL_ESTATE_NEWS
- These can be deleted when fully confident in real API

To use mock data for testing (emergency fallback):
1. Re-add fallback logic to `lib/hybrid-articles.ts`
2. Pass `useMockData: true` parameter to `getArticles()`

---

## Environment Variables Reference

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| `NEXT_PUBLIC_EXTERNAL_API_URL` | String | ✅ Yes | Public API endpoint |
| `HOMESPH_NEWS_API_KEY` | String | ✅ Yes | Secret API key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | String | ✅ Yes | Your site URL for proxy |

**Important**: Never commit `.env` with real API keys to public repositories. Use `.env.local` for local development.

---

## Questions?

If real articles aren't loading:
1. Check console for `[NewsAPI]` log messages
2. Check Network tab for `/api/v1/news/articles` request
3. Verify API key in backend proxy error logs
4. Review this guide section by section

Once API key is set and valid, real articles should load immediately! 🎉
