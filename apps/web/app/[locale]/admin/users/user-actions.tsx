'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, ShieldOff, Shield } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../../components/ui/dialog'
import { apiRequest } from '../../../../lib/api'
import { getMessages, type Locale } from '../../../../messages'

type Props = {
  userId: string
  currentRole: string
  isBanned: boolean
  bannedUntil: string | null
  locale: string
}

export function AdminUserActions({ userId, currentRole, isBanned, bannedUntil, locale }: Props) {
  const router = useRouter()
  const m = getMessages(locale as Locale)
  const [loading, setLoading] = useState(false)
  const [banOpen, setBanOpen] = useState(false)
  const [duration, setDuration] = useState('24')
  const [customHours, setCustomHours] = useState('')
  const [reason, setReason] = useState('')

  const effectivelyBanned = isBanned && (!bannedUntil || new Date(bannedUntil) > new Date())

  const toggleRole = async () => {
    setLoading(true)
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    await apiRequest(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    })
    router.refresh()
    setLoading(false)
  }

  const handleBan = async () => {
    setLoading(true)
    const hours = duration === 'custom' ? parseInt(customHours) || 24 : parseInt(duration)
    await apiRequest(`/admin/users/${userId}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ durationHours: hours, reason: reason || undefined }),
    })
    setBanOpen(false)
    router.refresh()
    setLoading(false)
  }

  const handleUnban = async () => {
    setLoading(true)
    await apiRequest(`/admin/users/${userId}/unban`, { method: 'PATCH' })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      {effectivelyBanned ? (
        <Button variant="outline" size="sm" disabled={loading} onClick={handleUnban}>
          <ShieldOff className="w-3.5 h-3.5 mr-1.5" />{m.admin.unban}
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10" disabled={loading} onClick={() => setBanOpen(true)}>
          <Ban className="w-3.5 h-3.5 mr-1.5" />{m.admin.ban}
        </Button>
      )}
      <Button variant="outline" size="sm" disabled={loading} onClick={toggleRole}>
        <Shield className="w-3.5 h-3.5 mr-1.5" />
        {currentRole === 'ADMIN' ? m.admin.demote : m.admin.promote}
      </Button>

      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{m.admin.banDialog}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{m.admin.banDuration}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{m.admin.ban1h}</SelectItem>
                  <SelectItem value="24">{m.admin.ban24h}</SelectItem>
                  <SelectItem value="72">{m.admin.ban3d}</SelectItem>
                  <SelectItem value="168">{m.admin.ban7d}</SelectItem>
                  <SelectItem value="720">{m.admin.ban30d}</SelectItem>
                  <SelectItem value="0">{m.admin.banPermanent}</SelectItem>
                  <SelectItem value="custom">{m.admin.banCustom}</SelectItem>
                </SelectContent>
              </Select>
              {duration === 'custom' && (
                <Input
                  type="number"
                  placeholder={m.admin.banCustomPlaceholder}
                  value={customHours}
                  onChange={e => setCustomHours(e.target.value)}
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label>{m.admin.banReason} <span className="text-muted-foreground text-xs">{m.admin.banReasonHint}</span></Label>
              <Input
                placeholder={m.admin.banReasonPlaceholder}
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanOpen(false)}>{m.admin.banCancel}</Button>
            <Button variant="destructive" disabled={loading} onClick={handleBan}>
              {m.admin.banConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
