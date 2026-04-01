import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardDeveloperDetailLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 px-6 py-6">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-[32rem]" />
        </CardContent>
      </Card>
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-3 px-6 py-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}