import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardMediaLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-3 h-4 w-[34rem]" />
      </div>
      <Skeleton className="h-24 w-full rounded-[2rem]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="border-slate-200 shadow-sm">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}