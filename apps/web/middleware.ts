import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
const DEFAULT_LOCALE = 'zh-CN'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001'
const STATUS_TTL_MS = 5_000

let setupComplete: boolean | null = null
let lastChecked = 0

async function isSetupComplete(): Promise<boolean> {
  if (setupComplete === true) return true
  const now = Date.now()
  if (setupComplete === false && now - lastChecked < STATUS_TTL_MS) return false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(`${API_BASE_URL}/api/setup/status`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const payload = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: { setupComplete?: boolean } }
      | null
    setupComplete = !!payload?.data?.setupComplete
    lastChecked = now
    return setupComplete
  } catch {
    lastChecked = now
    return setupComplete === true
  }
}

function getLocaleFromHeader(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q] = lang.trim().split(';q=')
      return { code: code.trim(), quality: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { code } of languages) {
    if (SUPPORTED_LOCALES.includes(code as (typeof SUPPORTED_LOCALES)[number])) {
      return code
    }
    const prefix = code.split('-')[0]
    const match = SUPPORTED_LOCALES.find((l) => l.startsWith(prefix))
    if (match) return match
  }

  return DEFAULT_LOCALE
}

function stripLocale(pathname: string): { locale: string; rest: string } {
  for (const locale of SUPPORTED_LOCALES) {
    if (pathname === `/${locale}`) return { locale, rest: '/' }
    if (pathname.startsWith(`/${locale}/`)) return { locale, rest: pathname.slice(`/${locale}`.length) }
  }
  return { locale: '', rest: pathname }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const pathnameLocale = SUPPORTED_LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  const ready = await isSetupComplete()
  const { locale: pathLocale, rest } = stripLocale(pathname)

  if (!ready) {
    const onSetup = rest === '/setup' || rest.startsWith('/setup/')
    if (!onSetup) {
      const detected = pathLocale || request.cookies.get('NEXT_LOCALE')?.value || getLocaleFromHeader(request)
      const safeLocale = SUPPORTED_LOCALES.includes(detected as (typeof SUPPORTED_LOCALES)[number])
        ? detected
        : DEFAULT_LOCALE
      const url = request.nextUrl.clone()
      url.pathname = `/${safeLocale}/setup`
      return NextResponse.redirect(url)
    }
  } else if (rest === '/setup') {
    const url = request.nextUrl.clone()
    url.pathname = `/${pathLocale || DEFAULT_LOCALE}`
    return NextResponse.redirect(url)
  }

  if (pathnameLocale) {
    const response = NextResponse.next()
    response.cookies.set('NEXT_LOCALE', pathnameLocale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
    })
    return response
  }

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  const detectedLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as (typeof SUPPORTED_LOCALES)[number])
      ? cookieLocale
      : getLocaleFromHeader(request)

  const url = request.nextUrl.clone()
  url.pathname = `/${detectedLocale}${pathname}`
  const response = NextResponse.redirect(url)
  response.cookies.set('NEXT_LOCALE', detectedLocale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  })
  return response
}

export const config = {
  matcher: ['/((?!api|_next|favicon|public|.*\\..*).*)'],
}
