'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

const LOCALES = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
] as const

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()

  // Extract current locale from pathname (e.g., /zh-CN/dashboard → zh-CN)
  const segments = pathname.split('/')
  const currentLocale = segments[1] || 'zh-CN'
  const currentLabel = LOCALES.find((l) => l.code === currentLocale)?.label ?? '中文'

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return

    // Replace locale segment in the pathname
    const newSegments = [...segments]
    newSegments[1] = newLocale
    const newPath = newSegments.join('/')

    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`

    router.push(newPath)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Languages className="w-4 h-4" />
          <span className="text-xs">{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => switchLocale(locale.code)}
            className={`cursor-pointer text-sm ${
              currentLocale === locale.code ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            {locale.label}
            {currentLocale === locale.code && (
              <span className="ml-auto text-xs text-primary">●</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
