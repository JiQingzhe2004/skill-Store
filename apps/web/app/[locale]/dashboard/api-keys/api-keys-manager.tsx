'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Key, Plus, Copy, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../../components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import { apiRequest, getErrorMessage } from '../../../../lib/api'
import { getMessages, type Locale } from '../../../../messages'

export type ApiClientItem = {
  id: string
  name: string
  keyPrefix: string
  status: 'ACTIVE' | 'REVOKED'
  lastUsedAt: string | null
  createdAt: string
}

type Props = {
  initialItems: ApiClientItem[]
}

export function ApiKeysManager({ initialItems }: Props) {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const m = getMessages(locale as Locale)
  const t = m.apiKeysPage

  const [items, setItems] = useState(initialItems)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    const res = await apiRequest<ApiClientItem & { apiKey: string }>('/api-clients', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    })
    setCreating(false)
    if (!res.success || !res.data) {
      toast.error(getErrorMessage(res))
      return
    }
    const { apiKey, ...client } = res.data
    setItems(prev => [client, ...prev])
    setName('')
    setNewKey(apiKey)
    router.refresh()
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t.copySuccess)
    } catch {
      toast.error(t.copyError)
    }
  }

  const handleToggleStatus = async (item: ApiClientItem) => {
    if (busyId) return
    setBusyId(item.id)
    const next = item.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE'
    const res = await apiRequest<ApiClientItem>(`/api-clients/${item.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    })
    setBusyId(null)
    if (!res.success || !res.data) {
      toast.error(getErrorMessage(res))
      return
    }
    setItems(prev => prev.map(i => (i.id === item.id ? res.data! : i)))
    toast.success(next === 'ACTIVE' ? t.enabled : t.revoked)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (busyId) return
    setBusyId(id)
    const res = await apiRequest(`/api-clients/${id}`, { method: 'DELETE' })
    setBusyId(null)
    if (!res.success) {
      toast.error(getErrorMessage(res))
      return
    }
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success(t.deleted)
    router.refresh()
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return t.neverUsed
    return new Date(iso).toLocaleString(locale === 'en-US' ? 'en-US' : 'zh-CN')
  }

  return (
    <div className="grid gap-6">
      <Card className="border-border/60 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.usageTitle}</CardTitle>
          <CardDescription className="text-xs">{t.usageDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1 font-mono text-xs text-muted-foreground">
          <p>{t.usageList}</p>
          <p>{t.usageDetail}</p>
          <p>{t.usageManifest}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />{t.createTitle}
          </CardTitle>
          <CardDescription className="text-xs">{t.createDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 grid gap-1.5">
            <Label htmlFor="key-name">{t.nameLabel}</Label>
            <Input
              id="key-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              maxLength={64}
            />
          </div>
          <Button className="sm:self-end" onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? t.creating : t.createBtn}
          </Button>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t.empty}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(item => (
            <Card key={item.id} className="border-border/60">
              <CardContent className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.name}</span>
                    <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {item.status === 'ACTIVE' ? t.statusActive : t.statusRevoked}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{item.keyPrefix}••••••••</p>
                  <p className="text-xs text-muted-foreground">
                    {t.createdAt.replace('{date}', formatDate(item.createdAt))}
                    {' · '}
                    {t.lastUsed.replace('{date}', formatDate(item.lastUsedAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => handleToggleStatus(item)}
                  >
                    {item.status === 'ACTIVE'
                      ? <><PowerOff className="w-3.5 h-3.5 mr-1" />{t.revokeBtn}</>
                      : <><Power className="w-3.5 h-3.5 mr-1" />{t.enableBtn}</>}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{m.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                          {m.common.delete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!newKey} onOpenChange={open => { if (!open) setNewKey(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.newKeyTitle}</DialogTitle>
            <DialogDescription>{t.newKeyDesc}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 p-3 font-mono text-xs break-all">{newKey}</div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => newKey && handleCopy(newKey)}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />{t.copyBtn}
            </Button>
            <Button onClick={() => setNewKey(null)}>{t.doneBtn}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}