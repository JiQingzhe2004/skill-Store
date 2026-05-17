import '../globals.css'

import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { headers, cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { getMessages, type Locale, DEFAULT_LOCALE } from '../../messages'
import { SiteNav } from '../../components/site-nav'
import { fetchCurrentUser } from '../../lib/server-auth'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const m = getMessages((locale as Locale) ?? DEFAULT_LOCALE)
  return {
    title: m.common.siteTitle,
    description: m.common.siteDescription,
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const headerStore = await headers()
  const cookieStore = await cookies()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()
  const user = await fetchCurrentUser({ host, cookieHeader })

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <SiteNav user={user} />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

