import { Skeleton } from '../../components/ui/skeleton'

function SkillCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-5 grid gap-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pt-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
