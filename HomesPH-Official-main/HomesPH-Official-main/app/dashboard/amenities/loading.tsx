import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardAmenitiesLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="space-y-2"><Skeleton className="h-10 w-72" /><Skeleton className="h-4 w-[30rem]" /></div>
      <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Card key={index} className="border-slate-200 shadow-sm"><CardContent className="space-y-3 px-5 py-5"><Skeleton className="h-5 w-28" /><Skeleton className="h-8 w-16" /></CardContent></Card>)}</div>
      <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-3 px-6 py-6"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-80 w-full rounded-xl" /></CardContent></Card>
    </div>
  )
}