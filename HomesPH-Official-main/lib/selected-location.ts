export const SELECTED_LOCATION_COOKIE = 'homesph_selected_location'
export const SELECTED_LOCATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function serializeSelectedLocationCookie(slug: string) {
  const encoded = encodeURIComponent(slug)
  return `${SELECTED_LOCATION_COOKIE}=${encoded}; path=/; max-age=${SELECTED_LOCATION_COOKIE_MAX_AGE}; sameSite=Lax`
}

export function clearSelectedLocationCookie() {
  return `${SELECTED_LOCATION_COOKIE}=; path=/; max-age=0; sameSite=Lax`
}
