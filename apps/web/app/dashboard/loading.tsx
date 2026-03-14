import { Skeleton } from '../../components/ui/skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-10 pt-24">
      <div className="mx-auto max-w-5xl grid gap-6">
        {/* 欢迎栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="grid gap-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        {/* 数据概览 */}
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
        {/* 技能列表 */}
        <div className="rounded-lg border border-border/60 p-5 grid gap-3">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
        {/* 快捷入口 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3.5">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="grid gap-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
