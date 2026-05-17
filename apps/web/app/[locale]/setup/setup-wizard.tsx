'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Database, Loader2, Mail, Settings2, ShieldCheck } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

type Step = 1 | 2 | 3 | 4

type DbForm = {
  host: string
  port: string
  user: string
  password: string
  database: string
  shadowDatabase: string
}

type SmtpForm = {
  host: string
  port: string
  user: string
  pass: string
  from: string
  testTo: string
}

type SiteForm = {
  appUrl: string
  adminSetupSecret: string
}

const stepLabels: { id: Step; label: string; icon: typeof Database }[] = [
  { id: 1, label: '数据库', icon: Database },
  { id: 2, label: '邮件 SMTP', icon: Mail },
  { id: 3, label: '站点信息', icon: Settings2 },
  { id: 4, label: '完成安装', icon: ShieldCheck },
]

async function apiPost<T>(path: string, body: unknown): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const payload = (await res.json().catch(() => null)) as
      | { success: boolean; data?: T; error?: { message?: string } }
      | null
    if (!payload) return { ok: false, error: '网络错误' }
    if (!payload.success) return { ok: false, error: payload.error?.message ?? '请求失败' }
    return { ok: true, data: payload.data }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '网络错误' }
  }
}

export function SetupWizard({ locale }: { locale: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  const [db, setDb] = useState<DbForm>({
    host: 'localhost',
    port: '3306',
    user: 'skill_store',
    password: '',
    database: 'skill_store',
    shadowDatabase: 'skill_store_shadow',
  })
  const [smtp, setSmtp] = useState<SmtpForm>({
    host: '',
    port: '587',
    user: '',
    pass: '',
    from: 'Skill Store <no-reply@example.com>',
    testTo: '',
  })
  const [site, setSite] = useState<SiteForm>({
    appUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    adminSetupSecret: '',
  })

  const [dbTesting, setDbTesting] = useState(false)
  const [dbResult, setDbResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [smtpTesting, setSmtpTesting] = useState(false)
  const [smtpResult, setSmtpResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [waitingRestart, setWaitingRestart] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !site.adminSetupSecret) {
      const bytes = new Uint8Array(16)
      window.crypto.getRandomValues(bytes)
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
      setSite((s) => ({ ...s, adminSetupSecret: hex }))
    }
  }, [site.adminSetupSecret])

  useEffect(() => {
    if (!waitingRestart) return
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch('/api/setup/status', { cache: 'no-store' })
        const payload = await res.json()
        if (payload?.success && payload?.data?.setupComplete) {
          if (!cancelled) {
            setDone(true)
            setWaitingRestart(false)
          }
          return true
        }
      } catch {
        // ignore
      }
      return false
    }
    const id = setInterval(() => {
      void check()
    }, 1500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [waitingRestart])

  const testDb = async () => {
    setDbTesting(true)
    setDbResult(null)
    const res = await apiPost<{ ok: boolean; error?: string }>('/setup/test-db', {
      db: {
        host: db.host.trim(),
        port: Number(db.port),
        user: db.user.trim(),
        password: db.password,
        database: db.database.trim(),
      },
    })
    setDbTesting(false)
    if (!res.ok) {
      setDbResult({ ok: false, message: res.error ?? '连接失败' })
      return
    }
    const data = res.data
    if (data && data.ok === false) {
      setDbResult({ ok: false, message: data.error ?? '连接失败' })
      return
    }
    setDbResult({ ok: true, message: '连接成功' })
  }

  const testSmtp = async () => {
    setSmtpTesting(true)
    setSmtpResult(null)
    const res = await apiPost<{ ok: boolean; error?: string }>('/setup/test-smtp', {
      smtp: {
        host: smtp.host.trim(),
        port: Number(smtp.port),
        user: smtp.user.trim() || undefined,
        pass: smtp.pass || undefined,
        from: smtp.from.trim(),
      },
      to: smtp.testTo.trim() || undefined,
    })
    setSmtpTesting(false)
    if (!res.ok) {
      setSmtpResult({ ok: false, message: res.error ?? '连接失败' })
      return
    }
    const data = res.data
    if (data && data.ok === false) {
      setSmtpResult({ ok: false, message: data.error ?? '连接失败' })
      return
    }
    setSmtpResult({
      ok: true,
      message: smtp.testTo.trim() ? '连接成功，测试邮件已发送' : '连接成功（未发送测试邮件）',
    })
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitting(true)
    const res = await apiPost('/setup/submit', {
      db: {
        host: db.host.trim(),
        port: Number(db.port),
        user: db.user.trim(),
        password: db.password,
        database: db.database.trim(),
        shadowDatabase: db.shadowDatabase.trim() || undefined,
      },
      smtp: {
        host: smtp.host.trim(),
        port: Number(smtp.port),
        user: smtp.user.trim() || undefined,
        pass: smtp.pass || undefined,
        from: smtp.from.trim(),
      },
      appUrl: site.appUrl.trim(),
      adminSetupSecret: site.adminSetupSecret.trim(),
    })
    setSubmitting(false)
    if (!res.ok) {
      setSubmitError(res.error ?? '安装失败')
      return
    }
    setWaitingRestart(true)
  }

  if (done) {
    return (
      <Card className="border-emerald-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            安装完成
          </CardTitle>
          <CardDescription>系统已就绪。下一步：注册第一个账号，邮箱验证后通过初始化密钥提升为管理员。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">初始化密钥（请妥善保存）</p>
            <code className="mt-1 block break-all text-xs text-muted-foreground">{site.adminSetupSecret}</code>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/${locale}?auth=register`)}>立即注册</Button>
            <Button variant="outline" onClick={() => router.push(`/${locale}`)}>返回首页</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (waitingRestart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            正在初始化数据库并重启服务
          </CardTitle>
          <CardDescription>已写入配置、执行迁移。后端正在以正常模式重启，预计 5-15 秒…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Store 安装向导</CardTitle>
        <CardDescription>检测到系统尚未初始化，请填写以下信息完成部署。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {stepLabels.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                  step === s.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : step > s.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : 'border-border text-muted-foreground'
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
              </div>
              <span className={step === s.id ? 'font-medium text-foreground' : 'text-muted-foreground'}>{s.label}</span>
              {i < stepLabels.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>MySQL 主机</Label>
                <Input value={db.host} onChange={(e) => setDb({ ...db, host: e.target.value })} placeholder="127.0.0.1" />
              </div>
              <div className="space-y-2">
                <Label>端口</Label>
                <Input value={db.port} onChange={(e) => setDb({ ...db, port: e.target.value })} placeholder="3306" />
              </div>
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input value={db.user} onChange={(e) => setDb({ ...db, user: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>密码</Label>
                <Input type="password" value={db.password} onChange={(e) => setDb({ ...db, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>主数据库名</Label>
                <Input value={db.database} onChange={(e) => setDb({ ...db, database: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Shadow 数据库名（Prisma 迁移用）</Label>
                <Input
                  value={db.shadowDatabase}
                  onChange={(e) => setDb({ ...db, shadowDatabase: e.target.value })}
                  placeholder="skill_store_shadow"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={testDb} disabled={dbTesting || !db.host || !db.user || !db.database}>
                {dbTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                测试连接
              </Button>
              {dbResult && (
                <span className={`text-sm ${dbResult.ok ? 'text-emerald-600' : 'text-destructive'}`}>{dbResult.message}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              提示：两个数据库都需要预先创建好（可使用 release 包内的 <code>create-db.sh</code> 一键建库），并赋予填写的用户读写权限。
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!dbResult?.ok}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>SMTP 主机</Label>
                <Input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label>端口</Label>
                <Input value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label>用户名（可选）</Label>
                <Input value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>密码 / 授权码（可选）</Label>
                <Input type="password" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>发件人（From）</Label>
                <Input value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} placeholder='Skill Store &lt;no-reply@your-domain.com&gt;' />
                <p className="text-xs text-muted-foreground">格式：<code>显示名 &lt;邮箱地址&gt;</code>，邮箱建议与 SMTP 用户名一致。</p>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>测试收件人（可选，填了会发一封测试邮件）</Label>
                <Input value={smtp.testTo} onChange={(e) => setSmtp({ ...smtp, testTo: e.target.value })} placeholder="your-email@example.com" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={testSmtp} disabled={smtpTesting || !smtp.host || !smtp.from}>
                {smtpTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                测试 SMTP
              </Button>
              {smtpResult && (
                <span className={`text-sm ${smtpResult.ok ? 'text-emerald-600' : 'text-destructive'}`}>{smtpResult.message}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              SMTP 用于发送注册验证码和忘记密码邮件。端口 465 走 SSL，587 走 STARTTLS。
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
              <Button onClick={() => setStep(3)} disabled={!smtp.host || !smtp.from}>下一步</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>站点访问地址（APP_URL）</Label>
              <Input value={site.appUrl} onChange={(e) => setSite({ ...site, appUrl: e.target.value })} placeholder="https://your-domain.com" />
              <p className="text-xs text-muted-foreground">用户访问前端的完整地址，用于 CORS 等。</p>
            </div>
            <div className="space-y-2">
              <Label>管理员初始化密钥</Label>
              <Input
                value={site.adminSetupSecret}
                onChange={(e) => setSite({ ...site, adminSetupSecret: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                安装完成后，注册首个账号，在 <code>/setup-admin</code> 输入这个密钥即可成为管理员。
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>上一步</Button>
              <Button onClick={() => setStep(4)} disabled={!site.appUrl || !site.adminSetupSecret}>下一步</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm space-y-2">
              <p><span className="text-muted-foreground">数据库：</span>{db.user}@{db.host}:{db.port}/{db.database}</p>
              <p><span className="text-muted-foreground">SMTP：</span>{smtp.host}:{smtp.port} ({smtp.from})</p>
              <p><span className="text-muted-foreground">站点：</span>{site.appUrl}</p>
              <p><span className="text-muted-foreground">JWT 密钥：</span>提交时由服务端自动生成 64 字节随机串</p>
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} disabled={submitting}>上一步</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                确认并开始安装
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
