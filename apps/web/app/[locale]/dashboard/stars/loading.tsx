import { Skeleton } from '../../../../components/ui/skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-10 pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-8 h-8 rounded-md" />
          <div className="grid gap-1.5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/60 p-5 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="w-5 h-5 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
