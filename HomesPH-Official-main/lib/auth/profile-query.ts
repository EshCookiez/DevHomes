import {
  isMissingAccountStateColumnError,
  withNormalizedAccountState,
} from '@/lib/account-status'
import { withNormalizedPrcState } from '@/lib/prc-status'

interface QueryErrorLike {
  code?: string
  message?: string
}

interface SupabaseQueryResult<T> {
  data: T | null
  error: QueryErrorLike | null
}

export async function getUserProfileWithAccountStateFallback<T extends object>({
  supabase,
  userId,
  selectWithAccountState,
  selectWithoutAccountState,
}: {
  supabase: any
  userId: string
  selectWithAccountState: string
  selectWithoutAccountState: string
}) {
  const primary = await supabase
    .from('user_profiles')
    .select(selectWithAccountState)
    .eq('user_id', userId)
    .maybeSingle() as SupabaseQueryResult<T & { is_active: boolean | null }>

  if (!isMissingAccountStateColumnError(primary.error)) {
    return {
      data: primary.data ? withNormalizedPrcState(withNormalizedAccountState(primary.data as any)) : null,
      error: primary.error,
    }
  }

  const fallback = await supabase
    .from('user_profiles')
    .select(selectWithoutAccountState)
    .eq('user_id', userId)
    .maybeSingle() as SupabaseQueryResult<T>

  return {
    data: fallback.data ? withNormalizedPrcState(withNormalizedAccountState(fallback.data as any)) : null,
    error: fallback.error,
  }
}

export const getUserProfileWithIsActiveFallback = getUserProfileWithAccountStateFallback
