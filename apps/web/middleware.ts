import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
const DEFAULT_LOCALE = 'zh-CN'

function getLocaleFromHeader(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  // Parse Accept-Language header: e.g. "en-US,en;q=0.9,zh-CN;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q] = lang.trim().split(';q=')
      return { code: code.trim(), quality: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { code } of languages) {
    // Exact match
    if (SUPPORTED_LOCALES.includes(code as (typeof SUPPORTED_LOCALES)[number])) {
      return code
    }
    // Prefix match: "en" → "en-US", "zh" → "zh-CN"
    const prefix = code.split('-')[0]
    const match = SUPPORTED_LOCALES.find((l) => l.startsWith(prefix))
    if (match) return match
  }

  return DEFAULT_LOCALE
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes, Next.js internals, and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if pathname already has a supported locale prefix
  const pathnameLocale = SUPPORTED_LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  if (pathnameLocale) {
    // Already has locale prefix — set cookie and let pass
    const response = NextResponse.next()
    response.cookies.set('NEXT_LOCALE', pathnameLocale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
    })
    return response
  }

  // Detect locale from cookie or Accept-Language header
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  const detectedLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as (typeof SUPPORTED_LOCALES)[number])
      ? cookieLocale
      : getLocaleFromHeader(request)

  // Redirect to /{locale}{pathname}
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
