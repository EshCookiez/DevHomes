import MediaManager from '@/components/media/media-manager'
import { getMediaLibrarySnapshot } from '@/lib/media-admin'

export default async function DashboardMediaPage() {
  const snapshot = await getMediaLibrarySnapshot('auto')
  return <MediaManager initialSnapshot={snapshot} />
}