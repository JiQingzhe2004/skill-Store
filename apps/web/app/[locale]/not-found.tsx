'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Boxes, Home, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { getMessages, type Locale } from '../../messages'

export default function NotFound() {
  const { locale } = useParams<{ locale: string }>()
  const m = getMessages((locale as Locale) ?? 'zh-CN')

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/50">
        <Link href={`/${locale ?? 'zh-CN'}`} className="flex items-center gap-2 font-semibold text-base tracking-tight hover:opacity-80 transition-opacity">
          <Boxes className="w-5 h-5 text-primary" />
          <span>Skill Store</span>
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* 404 number */}
        <div className="mb-8">
          <span className="text-[10rem] font-black leading-none tracking-tighter text-muted-foreground/10 select-none">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-3">{m.notFound.title}</h1>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-8">
          {m.notFound.description}
        </p>

        <div className="flex items-center gap-3">
          <Button asChild variant="default">
            <Link href={`/${locale ?? 'zh-CN'}`}>
              <Home className="w-4 h-4 mr-2" />
              {m.notFound.goHome}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale ?? 'zh-CN'}/skills`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {m.notFound.browseSkills}
            </Link>
          </Button>
        </div>

        <div className="mt-16 flex items-center gap-2 opacity-30">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skill Store
      </footer>
    </div>
  )
}
