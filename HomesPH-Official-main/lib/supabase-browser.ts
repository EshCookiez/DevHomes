import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let client: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseBrowserClient() {
	if (!client) {
		client = createBrowserClient(supabaseUrl, supabaseAnonKey)
	}

	return client
}

export const supabase = getSupabaseBrowserClient()
