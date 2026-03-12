import Link from 'next/link'
import { ReactNode } from 'react'

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
  links?: Array<{ href: string; label: string }>
}

export function AuthCard({ title, description, children, links = [] }: AuthCardProps) {
  return (
    <main className="page-shell">
      <section className="card">
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        {links.length > 0 ? (
          <nav className="footer-links">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </section>
    </main>
  )
}
