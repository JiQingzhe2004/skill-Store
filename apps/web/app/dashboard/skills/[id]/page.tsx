import { cookies, headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { fetchCurrentUser } from '../../../../lib/server-auth'
import { serverApiRequest } from '../../../../lib/server-api'
import { SiteNav } from '../../../../components/site-nav'
import { SkillEditor } from './skill-editor'

type Skill = {
  id: string
  slug: string
  name: string
  description: string
  tags: string
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED'
  latestVersion: string | null
  authorId: string
  createdAt: string
  updatedAt: string
}

type Version = {
  id: string
  version: string
  changelog: string | null
  publishedAt: string | null
  createdAt: string
}

type Props = { params: Promise<{ id: string }> }

export default async function SkillDetailPage({ params }: Props) {
  const { id } = await params
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const cookieHeader = cookieStore.toString()

  const user = await fetchCurrentUser({ host, cookieHeader })
  if (!user) redirect('/?auth=login')

  const [skillRes, versionsRes] = await Promise.all([
    serverApiRequest<Skill>(`/skills/${id}`, { host, cookieHeader }),
    serverApiRequest<Version[]>(`/skills/${id}/versions`, { host, cookieHeader }),
  ])

  if (!skillRes.success || !skillRes.data) notFound()

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-4xl">
          <SkillEditor
            skill={skillRes.data}
            versions={versionsRes.data ?? []}
          />
        </div>
      </main>
    </>
  )
}
