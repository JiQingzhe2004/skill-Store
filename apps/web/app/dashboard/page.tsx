import { Mail, ShieldCheck, UserRound, UserSquare2 } from 'lucide-react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { Badge } from '../../components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { fetchCurrentUser } from '../../lib/server-auth'
import { formatMessage, messages } from '../../messages'
import { LogoutButton } from './logout-button'

const accountItems = [
  { key: 'id', label: messages.dashboard.userId, icon: UserSquare2 },
  { key: 'email', label: messages.dashboard.email, icon: Mail },
  { key: 'username', label: messages.dashboard.username, icon: UserRound },
  { key: 'role', label: messages.dashboard.role, icon: ShieldCheck },
] as const

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const host = headerStore.get('host') ?? 'localhost:3000'

  const user = await fetchCurrentUser({
    host,
    cookieHeader: cookieStore.toString(),
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Card className="border-border/60 bg-background/95 shadow-lg backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{messages.common.brandDashboard}</Badge>
              <Badge variant={user.isEmailVerified ? 'secondary' : 'outline'}>
                {user.isEmailVerified ? messages.dashboard.verified : messages.dashboard.notVerified}
              </Badge>
            </div>
            <CardTitle className="text-3xl">{formatMessage(messages.dashboard.title, { username: user.username })}</CardTitle>
            <CardDescription className="max-w-3xl leading-6">{messages.dashboard.description}</CardDescription>
            <CardAction>
              <LogoutButton />
            </CardAction>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {accountItems.map((item) => {
            const Icon = item.icon
            const value = user[item.key]

            return (
              <Card key={item.key} size="sm" className="border-border/60 bg-background/95 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <span className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="size-4" />
                    </span>
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="break-all text-sm text-muted-foreground">{String(value)}</p>
                </CardContent>
              </Card>
            )
          })}

          <Card className="border-border/60 bg-background/95 shadow-md md:col-span-2">
            <CardHeader>
              <CardTitle>{messages.dashboard.currentProgress}</CardTitle>
              <CardDescription>{messages.dashboard.progressDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Card size="sm">
                <CardContent className="px-4 py-0 text-sm text-muted-foreground">{messages.dashboard.loginFlow}</CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="px-4 py-0 text-sm text-muted-foreground">{messages.dashboard.registerFlow}</CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="px-4 py-0 text-sm text-muted-foreground">{messages.dashboard.resetFlow}</CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="flex items-center justify-between gap-3 px-4 py-0 text-sm text-muted-foreground">
                  <span>{messages.dashboard.emailStatus}</span>
                  <Badge variant={user.isEmailVerified ? 'secondary' : 'outline'}>
                    {user.isEmailVerified ? messages.dashboard.verified : messages.dashboard.notVerified}
                  </Badge>
                </CardContent>
              </Card>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">Skill Store v1 当前已完成认证闭环。</CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
