'use client'

import { useState, useEffect } from 'react'
import { User, MessageSquare, Trash2, Reply, Send } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
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
} from './ui/alert-dialog'
import { apiRequest, getErrorMessage } from '../lib/api'
import { cn } from '../lib/utils'
import { toast } from 'sonner'

type CommentUser = { id: string; username: string; avatar: string | null }

type Comment = {
  id: string
  content: string
  createdAt: string
  user: CommentUser
  replies?: Comment[]
  parentId: string | null
}

type Props = {
  slug: string
  isLoggedIn: boolean
  currentUserId?: string
  currentUserAvatar?: string | null
  currentUsername?: string
  isAdmin?: boolean
}

function Avatar({ user }: { user: CommentUser }) {
  return user.avatar ? (
    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
      <User className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}

function CommentItem({
  comment, slug, currentUserId, isAdmin, onDeleted, onReplied, depth = 0
}: {
  comment: Comment
  slug: string
  currentUserId?: string
  isAdmin?: boolean
  onDeleted: (id: string) => void
  onReplied: (comment: Comment) => void
  depth?: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canDelete = isAdmin || currentUserId === comment.user.id
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDelete = async () => {
    const res = await apiRequest(`/skills/public/comments/${comment.id}`, { method: 'DELETE' })
    if (res.success) { setDeleteOpen(false); onDeleted(comment.id); toast.success('评论已删除') }
    else toast.error(getErrorMessage(res))
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setLoading(true); setError('')
    const res = await apiRequest<Comment>(`/skills/public/${slug}/comments`, {
      method: 'POST',

      body: JSON.stringify({ content: replyContent.trim(), parentId: comment.id }),
    })
    setLoading(false)
    if (res.success && res.data) {
      onReplied(res.data)
      setReplyContent('')
      setShowReply(false)
      toast.success('回复成功')
    } else {
      toast.error(getErrorMessage(res))
    }
  }

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-10 mt-3')}>
      <Avatar user={comment.user} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.user.username}</span>
          <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {currentUserId && depth === 0 && (
            <button
              onClick={() => setShowReply(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="w-3 h-3" />回复
            </button>
          )}
          {canDelete && (
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />删除
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>删除评论</AlertDialogTitle>
                  <AlertDialogDescription>确定要删除这条评论吗？此操作不可撤销。</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {showReply && (
          <div className="mt-2 flex gap-2">
            <Textarea
              rows={2}
              placeholder="回复..."
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              className="text-sm"
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={handleReply} disabled={loading}><Send className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setShowReply(false)}>取消</Button>
            </div>
          </div>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        {(comment.replies ?? []).map(reply => (
          <CommentItem key={reply.id} comment={reply} slug={slug} currentUserId={currentUserId}
            isAdmin={isAdmin} onDeleted={onDeleted} onReplied={() => {}} depth={depth + 1} />
        ))}
      </div>
    </div>
  )
}

export function SkillComments({ slug, isLoggedIn, currentUserId, currentUserAvatar, currentUsername, isAdmin }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest<{ items: Comment[]; total: number }>(`/skills/public/${slug}/comments`).then(res => {
      if (res.success && res.data) { setComments(res.data.items); setTotal(res.data.total) }
      setLoading(false)
    })
  }, [slug])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSubmitting(true); setError('')
    const res = await apiRequest<Comment>(`/skills/public/${slug}/comments`, {
      method: 'POST',

      body: JSON.stringify({ content: content.trim() }),
    })
    setSubmitting(false)
    if (res.success && res.data) {
      setComments(prev => [res.data!, ...prev])
      setTotal(prev => prev + 1)
      setContent('')
      toast.success('评论发表成功')
    } else {
      toast.error(getErrorMessage(res))
    }
  }

  const handleDeleted = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id).map(c => ({
      ...c, replies: (c.replies ?? []).filter(r => r.id !== id)
    })))
    setTotal(prev => prev - 1)
  }

  const handleReplied = (reply: Comment) => {
    setComments(prev => prev.map(c =>
      c.id === reply.parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c
    ))
  }

  return (
    <div className="mt-6 rounded-lg border border-border/60 bg-background/95 shadow-sm">
      <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium text-sm">评论</span>
        {total > 0 && <span className="text-xs text-muted-foreground">({total})</span>}
      </div>

      {/* 发表评论 */}
      <div className="px-6 py-4 border-b border-border/40">
        {isLoggedIn ? (
          <div className="flex gap-3">
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt={currentUsername ?? ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Textarea
                rows={3}
                placeholder="写下你的评论..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="mb-2 text-sm"
              />
              {error && <p className="text-xs text-destructive mb-2">{error}</p>}
              <Button size="sm" onClick={handleSubmit} disabled={submitting || !content.trim()} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />{submitting ? '发送中...' : '发表评论'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <a href="/?auth=login" className="text-primary hover:underline">登录</a> 后发表评论
          </p>
        )}
      </div>

      {/* 评论列表 */}
      <div className="px-6 py-4 grid gap-5">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">加载中...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暂无评论，来发表第一条吧</p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} slug={slug}
              currentUserId={currentUserId} isAdmin={isAdmin}
              onDeleted={handleDeleted} onReplied={handleReplied} />
          ))
        )}
      </div>
    </div>
  )
}
