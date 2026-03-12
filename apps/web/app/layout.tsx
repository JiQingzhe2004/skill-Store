import './globals.css'

import type { Metadata } from 'next'
import { ReactNode } from 'react'

import { messages } from '../messages'

export const metadata: Metadata = {
  title: messages.common.siteTitle,
  description: messages.common.siteDescription,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
