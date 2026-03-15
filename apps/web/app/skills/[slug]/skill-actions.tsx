'use client'

import { useState } from 'react'
import { Star, ThumbsUp, Download } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { apiRequest, getErrorMessage } from '../../../lib/api'

type Props = {
  slug: string
  initialStarCount: number
  initialLikeCount: number
  initialDownloadCount: number
  initialStarred: boolean
  initialLiked: boolean
  isLoggedIn: boolean
}

export function SkillActions({
  slug,
  initialStarCount,
  initialLikeCount,
  initialDownloadCount,
  initialStarred,
  initialLiked,
  isLoggedIn,
}: Props) {
  const [starCount, setStarCount] = useState(initialStarCount)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [starred, setStarred] = useState(initialStarred)
  const [liked, setLiked] = useState(initialLiked)
  const [starLoading, setStarLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [installLoading, setInstallLoading] = useState(false)
  const [installMsg, setInstallMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const handleStar = async () => {
    if (!isLoggedIn) { window.location.href = '/?auth=login'; return }
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
    if (!isLoggedIn) { window.location.href = '/?auth=login'; return }
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

  const [downloadCount, setDownloadCount] = useState(initialDownloadCount)

  const handleInstall = async () => {
    if (!isLoggedIn) { window.location.href = '/?auth=login'; return }
    if (installLoading) return
    setInstallLoading(true); setInstallMsg(''); setErrMsg('')
    const res = await apiRequest<{ message: string }>(`/skills/public/${slug}/install`, { method: 'POST' })
    if (res.success) {
      setInstallMsg('✓ 已标记为安装')
      setDownloadCount(prev => prev + 1)
      setTimeout(() => setInstallMsg(''), 3000)
    } else {
      setErrMsg(getErrorMessage(res))
      setTimeout(() => setErrMsg(''), 3000)
    }
    setInstallLoading(false)
  }

  return (
    <div className="grid gap-2">
      {errMsg && <p className="text-xs text-destructive text-right">{errMsg}</p>}
      {installMsg && <p className="text-xs text-green-600 text-right">{installMsg}</p>}
      <div className="flex items-center gap-2">
          <Button
            variant={starred ? 'default' : 'outline'}
            size="sm"
            onClick={handleStar}
            disabled={starLoading}
            className="gap-1.5"
          >
            <Star className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
            {starCount}
          </Button>
          <Button
            variant={liked ? 'default' : 'outline'}
            size="sm"
            onClick={handleLike}
            disabled={likeLoading}
            className="gap-1.5"
          >
            <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>
        <Button size="lg" className="ml-2 gap-2" onClick={handleInstall} disabled={installLoading}>
          <Download className="w-4 h-4" />
          {installLoading ? '处理中...' : `安装 · ${downloadCount}`}
        </Button>
      </div>
    </div>
  )
}
