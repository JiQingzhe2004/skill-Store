import { Skeleton } from '../../components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen pt-14 flex">
      <aside className="w-52 shrink-0 border-r border-border/50 py-6 px-3 hidden md:block">
        <div className="flex items-center gap-2 px-2 mb-6">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6">
        <div className="grid gap-6">
          <Skeleton className="h-7 w-24" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="grid gap-1.5">
                    <Skeleton className="h-7 w-10" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
