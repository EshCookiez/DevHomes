function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
}

export default function ProfileLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}
