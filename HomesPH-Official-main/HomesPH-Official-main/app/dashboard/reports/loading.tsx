import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardReportsLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="space-y-2"><Skeleton className="h-10 w-80" /><Skeleton className="h-4 w-[36rem]" /></div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <Card key={index} className="border-slate-200 shadow-sm"><CardContent className="space-y-3 px-5 py-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20" /><Skeleton className="h-16 w-full rounded-xl" /></CardContent></Card>)}</div>
      <div className="grid gap-6 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="border-slate-200 shadow-sm"><CardContent className="space-y-3 px-5 py-5"><Skeleton className="h-5 w-40" /><Skeleton className="h-56 w-full rounded-xl" /></CardContent></Card>)}</div>
    </div>
  )
}