import SubofficeManager from '@/components/dashboard/SubofficeManager'
import { fetchMySuboffices, fetchSubofficeAssignableMembers } from './actions'

type InitialSuboffices = Awaited<ReturnType<typeof fetchMySuboffices>>
type AssignableMembers = Awaited<ReturnType<typeof fetchSubofficeAssignableMembers>>

export default async function SubofficesPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string | string[] }>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const initialEditOfficeId = Array.isArray(resolvedSearchParams.edit)
    ? resolvedSearchParams.edit[0] ?? null
    : resolvedSearchParams.edit ?? null
  let initialLoadError: string | null = null
  let initialSuboffices: InitialSuboffices = []
  let assignableMembers: AssignableMembers = []

  try {
    ;[initialSuboffices, assignableMembers] = await Promise.all([
      fetchMySuboffices(),
      fetchSubofficeAssignableMembers(),
    ])
  } catch (error) {
    initialLoadError =
      error instanceof Error
        ? error.message
        : 'Suboffice data could not be loaded right now. Please refresh and try again.'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SubofficeManager
        assignableMembers={assignableMembers}
        initialEditOfficeId={initialEditOfficeId}
        initialLoadError={initialLoadError}
        initialSuboffices={initialSuboffices}
      />
    </div>
  )
}
