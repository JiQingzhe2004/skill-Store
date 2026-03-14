import { Skeleton } from '../../../../components/ui/skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-10 pt-24">
      <div className="mx-auto max-w-xl grid gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="rounded-lg border border-border/60 p-6 grid gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    </main>
  )
}
