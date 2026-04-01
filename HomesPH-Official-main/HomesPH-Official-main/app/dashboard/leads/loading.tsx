import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLeadsLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="space-y-2"><Skeleton className="h-10 w-80" /><Skeleton className="h-4 w-[34rem]" /></div>
      <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="border-slate-200 shadow-sm"><CardContent className="space-y-3 px-5 py-5"><Skeleton className="h-12 w-12 rounded-xl" /><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-16" /></CardContent></Card>)}</div>
      <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-3 px-6 py-6">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-xl" />)}</CardContent></Card>
    </div>
  )
}