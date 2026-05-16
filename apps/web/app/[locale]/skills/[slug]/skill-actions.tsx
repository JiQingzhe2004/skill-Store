'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Star, ThumbsUp, Download, Package, Check } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { apiRequest, getErrorMessage } from '../../../../lib/api'
import { getMessages, type Locale } from '../../../../messages'

type InstallResponse = {
  version: string
  slug: string
  name: string
}

type Props = {
  slug: string
  latestVersion: string | null
  initialStarCount: number
  initialLikeCount: number
  initialDownloadCount: number
  initialStarred: boolean
  initialLiked: boolean
  initialInstalled: boolean
  initialInstalledVersion: string | null
  isLoggedIn: boolean
}

export function SkillActions({
  slug,
  latestVersion,
  initialStarCount,
  initialLikeCount,
  initialDownloadCount,
  initialStarred,
  initialLiked,
  initialInstalled,
  initialInstalledVersion,
  isLoggedIn,
}: Props) {
  const { locale } = useParams<{ locale: string }>()
  const m = getMessages(locale as Locale)
  const [starCount, setStarCount] = useState(initialStarCount)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [downloadCount, setDownloadCount] = useState(initialDownloadCount)
  const [starred, setStarred] = useState(initialStarred)
  const [liked, setLiked] = useState(initialLiked)
  const [installed, setInstalled] = useState(initialInstalled)
  const [installedVersion, setInstalledVersion] = useState(initialInstalledVersion)
  const [starLoading, setStarLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [installLoading, setInstallLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [installMsg, setInstallMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const hasUpdate = installed && latestVersion && installedVersion && latestVersion !== installedVersion

  const handleStar = async () => {
    if (!isLoggedIn) { window.location.href = `/${locale}/?auth=login`; return }
    if (starLoading) return
    setStarLoading(true); setErrMsg('')
    const res = await apiRequest<{ starred: boolean }>(`/skills/public/${slug}/star`, { method: 'POST' })
    if (res.success && res.data) {
      setStarred(res.data.starred)
      setStarCount(prev => res.data!.starred ? prev + 1 : prev - 1)
    } else {
      setErrMsg(getErrorMessage(res))
      setTimeout(() => setErrMsg(''), 3000)
    }
    setStarLoading(false)
  }

  const handleLike = async () => {
    if (!isLoggedIn) { window.location.href = `/${locale}/?auth=login`; return }
    if (likeLoading) return
    setLikeLoading(true); setErrMsg('')
    const res = await apiRequest<{ liked: boolean }>(`/skills/public/${slug}/like`, { method: 'POST' })
    if (res.success && res.data) {
      setLiked(res.data.liked)
      setLikeCount(prev => res.data!.liked ? prev + 1 : prev - 1)
    } else {
      setErrMsg(getErrorMessage(res))
      setTimeout(() => setErrMsg(''), 3000)
    }
    setLikeLoading(false)
  }

  const handleInstall = async () => {
    if (!isLoggedIn) { window.location.href = `/${locale}/?auth=login`; return }
    if (installLoading) return
    setInstallLoading(true); setInstallMsg(''); setErrMsg('')
    const res = await apiRequest<InstallResponse>(`/skills/public/${slug}/install`, { method: 'POST' })
    if (res.success && res.data) {
      setInstalled(true)
      setInstalledVersion(res.data.version)
      setInstallMsg(
        hasUpdate
          ? m.skillActions.updateSuccess.replace('{version}', res.data.version)
          : m.skillActions.installSuccess.replace('{version}', res.data.version),
      )
      setTimeout(() => setInstallMsg(''), 4000)
    } else {
      setErrMsg(getErrorMessage(res))
      setTimeout(() => setErrMsg(''), 3000)
    }
    setInstallLoading(false)
  }

  const handleUninstall = async () => {
    if (!isLoggedIn || installLoading) return
    setInstallLoading(true); setErrMsg('')
    const res = await apiRequest(`/skills/public/${slug}/install`, { method: 'DELETE' })
    if (res.success) {
      setInstalled(false)
      setInstalledVersion(null)
      setInstallMsg(m.skillActions.uninstallSuccess)
      setTimeout(() => setInstallMsg(''), 3000)
    } else {
      setErrMsg(getErrorMessage(res))
      setTimeout(() => setErrMsg(''), 3000)
    }
    setInstallLoading(false)
  }

  const handleDownload = async () => {
    if (downloadLoading) return
    setDownloadLoading(true); setErrMsg('')
    try {
      await apiRequest(`/skills/public/${slug}/download/count`, { method: 'POST' })
      setDownloadCount(prev => prev + 1)
      const a = document.createElement('a')
      a.href = `/api/skills/public/${slug}/download`
      a.download = ''
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      setErrMsg(m.skillActions.downloadError)
      setTimeout(() => setErrMsg(''), 3000)
    }
    setDownloadLoading(false)
  }

  const installLabel = installed && installedVersion
    ? (hasUpdate
      ? m.skillActions.updateTo.replace('{version}', latestVersion ?? '')
      : m.skillActions.installed.replace('{version}', installedVersion))
    : m.skillActions.install

  return (
    <div className="grid gap-2">
      {errMsg && <p className="text-xs text-destructive text-right">{errMsg}</p>}
      {installMsg && <p className="text-xs text-green-600 text-right">{installMsg}</p>}
      {installed && isLoggedIn && (
        <p className="text-xs text-muted-foreground text-right">
          <Link href={`/${locale}/dashboard/installs`} className="hover:text-foreground underline-offset-2 hover:underline">
            {m.skillActions.viewMyInstalls}
          </Link>
          {' · '}
          <button type="button" onClick={handleUninstall} className="hover:text-foreground underline-offset-2 hover:underline">
            {m.skillActions.uninstall}
          </button>
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Button variant={starred ? 'default' : 'outline'} size="sm" onClick={handleStar} disabled={starLoading} className="gap-1.5">
          <Star className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />{starCount}
        </Button>
        <Button variant={liked ? 'default' : 'outline'} size="sm" onClick={handleLike} disabled={likeLoading} className="gap-1.5">
          <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />{likeCount}
        </Button>
        <Button
          size="lg"
          className="gap-2"
          variant={installed && !hasUpdate ? 'secondary' : 'default'}
          onClick={handleInstall}
          disabled={installLoading || (installed && !hasUpdate)}
        >
          {installed && !hasUpdate
            ? <Check className="w-4 h-4" />
            : <Package className="w-4 h-4" />}
          {installLoading ? m.skillActions.installing : installLabel}
        </Button>
        <Button size="lg" variant="outline" className="gap-2" onClick={handleDownload} disabled={downloadLoading}>
          <Download className="w-4 h-4" />
          {downloadLoading ? m.skillActions.downloading : m.skillActions.download.replace('{count}', String(downloadCount))}
        </Button>
      </div>
    </div>
  )
}
