'use client'

// 静态线条背景（仅暗色模式显示）

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
      {/* 背景渐变：顶部稍亮、底部更暗 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),transparent_55%),linear-gradient(to_bottom,rgba(15,23,42,0.9),rgba(15,23,42,1))]" />

      {/* 线条网格背景 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/25 [mask-image:radial-gradient(circle_at_center,white,transparent_80%)]">
        <svg
          width="1300"
          height="1300"
          viewBox="0 0 1300 1300"
          className="opacity-80"
        >
          {/* 竖直线条 */}
          <g stroke="currentColor" strokeWidth="0.6" strokeLinecap="round">
            {Array.from({ length: 41 }).map((_, i) => {
              const x = 50 + i * 30
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={100}
                  x2={x}
                  y2={1200}
                  opacity={0.25 + (i % 4 === 0 ? 0.12 : 0)}
                />
              )
            })}
          </g>

          {/* 水平线条 */}
          <g stroke="currentColor" strokeWidth="0.6" strokeLinecap="round">
            {Array.from({ length: 37 }).map((_, i) => {
              const y = 100 + i * 30
              return (
                <line
                  key={`h-${i}`}
                  x1={50}
                  x2={1250}
                  y1={y}
                  y2={y}
                  opacity={0.2 + (i % 3 === 0 ? 0.1 : 0)}
                />
              )
            })}
          </g>

        </svg>
      </div>
    </div>
  )
}



