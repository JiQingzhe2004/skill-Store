'use client'

import type { ReactNode } from 'react'

export function HeroAnimated({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
    </div>
  )
}

export function FeaturesAnimated({ cards }: { cards: { icon: ReactNode; title: string; desc: string }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {cards.map(({ icon, title, desc }) => (
        <div
          key={title}
          className="group relative rounded-xl border border-border/60 bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-border"
        >
          <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            {icon}
          </div>
          <h3 className="font-semibold text-sm mb-2">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  )
}

