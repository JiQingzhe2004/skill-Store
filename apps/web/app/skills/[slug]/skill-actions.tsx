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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <Button
              variant={starred ? 'default' : 'outline'}
              size="sm"
              onClick={handleStar}
              disabled={starLoading}
              className="w-9 h-9"
            >
              <Star className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
            </Button>
            <span className="text-[11px] text-muted-foreground">{starCount}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Button
              variant={liked ? 'default' : 'outline'}
              size="sm"
              onClick={handleLike}
              disabled={likeLoading}
              className="w-9 h-9"
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </Button>
            <span className="text-[11px] text-muted-foreground">{likeCount}</span>
          </div>
        </div>
        <Button size="lg" className="ml-2 gap-2">
          <Download className="w-4 h-4" />
          安装 · {initialDownloadCount}
        </Button>
      </div>
    </div>
  )
}
