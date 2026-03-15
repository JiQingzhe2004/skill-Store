import { Skeleton } from '../../../../components/ui/skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-10 pt-24">
      <div className="mx-auto max-w-2xl grid gap-6">
        <Skeleton className="h-7 w-24" />
        {/* 头像卡片 */}
        <div className="rounded-lg border border-border/60 p-6 grid gap-4">
          <Skeleton className="h-5 w-12" />
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        {/* 基本信息卡片 */}
        <div className="rounded-lg border border-border/60 p-6 grid gap-5">
          <Skeleton className="h-5 w-16" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </main>
  )
}
