import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseProjectRef = (() => {
	try {
		return new URL(supabaseUrl).hostname.split('.')[0] ?? null
	} catch {
		return null
	}
})()
const supabaseStorageKey = supabaseProjectRef ? `sb-${supabaseProjectRef}-auth-token` : null

let client: ReturnType<typeof createBrowserClient> | undefined
let browserSessionHealthCheck: Promise<void> | null = null
let hasCompletedBrowserSessionHealthCheck = false

export function getSupabaseBrowserClient() {
	if (!client) {
		client = createBrowserClient(supabaseUrl, supabaseAnonKey)
	}

	return client
}

function getBrowserSessionStorageKeys() {
	if (!supabaseStorageKey) {
		return []
	}

	return [
		supabaseStorageKey,
		`${supabaseStorageKey}-code-verifier`,
		`${supabaseStorageKey}-user`,
	]
}

function clearCookie(name: string) {
	if (typeof document === 'undefined') {
		return
	}

	document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

function clearBrowserSessionCookies() {
	if (typeof document === 'undefined' || !supabaseStorageKey) {
		return
	}

	const cookieNames = document.cookie
		.split(';')
		.map((segment) => segment.trim().split('=')[0])
		.filter(Boolean)

	const keysToClear = new Set<string>(getBrowserSessionStorageKeys())

	for (const cookieName of cookieNames) {
		if (cookieName === supabaseStorageKey || cookieName.startsWith(`${supabaseStorageKey}.`)) {
			keysToClear.add(cookieName)
		}
	}

	for (const key of keysToClear) {
		clearCookie(key)
	}
}

export function isInvalidRefreshTokenError(error: unknown) {
	const message =
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: ''

	return /invalid refresh token|refresh token not found/i.test(message)
}

export async function clearStaleBrowserSupabaseSession(
	targetClient: ReturnType<typeof createBrowserClient> = getSupabaseBrowserClient(),
) {
	try {
		await targetClient.auth.signOut({ scope: 'local' })
	} catch {
		// Best-effort cleanup continues through local storage and session storage.
	}

	if (typeof window === 'undefined') {
		hasCompletedBrowserSessionHealthCheck = false
		return
	}

	for (const key of getBrowserSessionStorageKeys()) {
		try {
			window.localStorage.removeItem(key)
		} catch {
			// Ignore storage cleanup failures in private / restricted browser contexts.
		}

		try {
			window.sessionStorage.removeItem(key)
		} catch {
			// Ignore storage cleanup failures in private / restricted browser contexts.
		}
	}

	clearBrowserSessionCookies()
	hasCompletedBrowserSessionHealthCheck = false
}

export async function ensureSupabaseBrowserSessionHealth(
	targetClient: ReturnType<typeof createBrowserClient> = getSupabaseBrowserClient(),
) {
	if (typeof window === 'undefined' || hasCompletedBrowserSessionHealthCheck) {
		return
	}

	if (!browserSessionHealthCheck) {
		browserSessionHealthCheck = (async () => {
			try {
				const { error } = await targetClient.auth.getSession()

				if (error && isInvalidRefreshTokenError(error)) {
					await clearStaleBrowserSupabaseSession(targetClient)
				}
			} catch (error) {
				if (isInvalidRefreshTokenError(error)) {
					await clearStaleBrowserSupabaseSession(targetClient)
					return
				}

				throw error
			} finally {
				hasCompletedBrowserSessionHealthCheck = true
				browserSessionHealthCheck = null
			}
		})()
	}

	await browserSessionHealthCheck
}

export const supabase = getSupabaseBrowserClient()
