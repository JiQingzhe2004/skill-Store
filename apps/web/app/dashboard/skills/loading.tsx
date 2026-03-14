import { Skeleton } from '../../../components/ui/skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-10 pt-24">
      <div className="mx-auto max-w-4xl grid gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
