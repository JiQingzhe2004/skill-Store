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
  isLoggedIn: boolean
}

export function SkillActions({ slug, initialStarCount, initialLikeCount, initialDownloadCount, isLoggedIn }: Props) {
  const [starCount, setStarCount] = useState(initialStarCount)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [starred, setStarred] = useState(false)
  const [liked, setLiked] = useState(false)
  const [starLoading, setStarLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
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

  return (
    <div className="grid gap-2">
      {errMsg && <p className="text-xs text-destructive text-right">{errMsg}</p>}
      <div className="flex items-center gap-2">
      <Button
        variant={starred ? 'default' : 'outline'}
        size="sm"
        onClick={handleStar}
        disabled={starLoading}
        className="gap-1.5"
      >
        <Star className={`w-3.5 h-3.5 ${starred ? 'fill-current' : ''}`} />
        <span>{starCount}</span>
      </Button>
      <Button
        variant={liked ? 'default' : 'outline'}
        size="sm"
        onClick={handleLike}
        disabled={likeLoading}
        className="gap-1.5"
      >
        <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
        <span>{likeCount}</span>
      </Button>
      <Button size="lg" className="ml-2 gap-2">
        <Download className="w-4 h-4" />
        安装 · {initialDownloadCount}
      </Button>
      </div>
    </div>
  )
}
