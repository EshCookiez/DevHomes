import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardUsersLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-[32rem]" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-slate-200 shadow-sm">
            <CardContent className="px-5 py-5">
              <Skeleton className="h-16 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="ml-auto h-10 w-36" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}