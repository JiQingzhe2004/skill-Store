import { Skeleton } from '../../../../components/ui/skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-10 pt-24">
      <div className="mx-auto max-w-4xl grid gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-md" />
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        {/* Tabs */}
        <div className="grid gap-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="rounded-lg border border-border/60 p-6 grid gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </main>
  )
}
