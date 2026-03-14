import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { fetchCurrentUser } from '../../../../lib/server-auth'
import { SiteNav } from '../../../../components/site-nav'
import { NewSkillForm } from './new-skill-form'

export default async function NewSkillPage() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'
  const user = await fetchCurrentUser({ host, cookieHeader: cookieStore.toString() })
  if (!user) redirect('/?auth=login')

  return (
    <>
      <SiteNav user={user} />
      <main className="min-h-screen px-4 py-10 pt-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">新建技能</h1>
            <p className="text-sm text-muted-foreground mt-1">填写基本信息，创建后可继续添加版本内容</p>
          </div>
          <NewSkillForm />
        </div>
      </main>
    </>
  )
}
