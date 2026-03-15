'use client'

import Link from 'next/link'
import { User, Download, Star, ThumbsUp } from 'lucide-react'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'

type PublicSkill = {
  id: string; slug: string; name: string; description: string; tags: string
  latestVersion: string | null; updatedAt: string
  downloadCount: number; starCount: number; likeCount: number
  author: { username: string; avatar?: string | null }
}

const ease = [0.25, 0.1, 0.25, 1] as const

export function SkillsGridAnimated({ items, locale }: { items: PublicSkill[]; locale: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((skill) => (
        <div key={skill.id}>
          <Link href={`/${locale}/skills/${skill.slug}`}>
            <Card className="h-full border-border/60 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-border cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{skill.name}</CardTitle>
                  {skill.latestVersion && (
                    <Badge variant="secondary" className="shrink-0 text-xs">v{skill.latestVersion}</Badge>
                  )}
                </div>
                <CardDescription className="text-xs line-clamp-2 leading-relaxed">{skill.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {skill.author.avatar
                        ? <img src={skill.author.avatar} alt={skill.author.username} className="w-full h-full object-cover" />
                        : <User className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <span>{skill.author.username}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{skill.downloadCount}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />{skill.starCount}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{skill.likeCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  )
}
