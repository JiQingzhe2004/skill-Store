import { Skeleton } from '../../../../components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-16">
        <section className="py-10 px-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-20 mb-6" />
          {/* Header Card */}
          <div className="rounded-lg border border-border/60 p-6 mb-6 grid gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
          {/* Versions */}
          <div className="rounded-lg border border-border/60 p-6 grid gap-4">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
