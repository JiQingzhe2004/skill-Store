'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { buildSkillsMarketQuery } from '../lib/skills-market-query'
import { getMessages, type Locale } from '../messages'

export type PublicTagOption = { tag: string; count: number }

type Props = {
  locale: string
  initialQ?: string
  initialTag?: string
  initialSort?: string
  tags: PublicTagOption[]
}

export function SkillsMarketToolbar({
  locale,
  initialQ = '',
  initialTag = '',
  initialSort = 'updated',
  tags,
}: Props) {
  const router = useRouter()
  const m = getMessages(locale as Locale)
  const t = m.skillsPage
  const [q, setQ] = useState(initialQ)

  const navigate = (next: { q?: string; tag?: string; sort?: string; page?: number }) => {
    const href = `/${locale}/skills${buildSkillsMarketQuery({
      page: next.page ?? 1,
      q: next.q !== undefined ? next.q : q,
      tag: next.tag !== undefined ? next.tag : initialTag,
      sort: next.sort !== undefined ? next.sort : initialSort,
    })}`
    router.push(href)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    navigate({ q, page: 1 })
  }

  const clearFilters = () => {
    setQ('')
    router.push(`/${locale}/skills`)
  }

  const hasFilters = Boolean(initialQ || initialTag || (initialSort && initialSort !== 'updated'))

  return (
    <div className="mb-8 grid gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-9"
            maxLength={100}
          />
        </div>
        <Select
          value={initialSort || 'updated'}
          onValueChange={value => navigate({ sort: value, page: 1 })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t.sortLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">{t.sortUpdated}</SelectItem>
            <SelectItem value="downloads">{t.sortDownloads}</SelectItem>
            <SelectItem value="stars">{t.sortStars}</SelectItem>
            <SelectItem value="likes">{t.sortLikes}</SelectItem>
            <SelectItem value="name">{t.sortName}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">{t.search}</Button>
        {hasFilters && (
          <Button type="button" variant="outline" onClick={clearFilters} className="gap-1.5">
            <X className="w-4 h-4" />
            {t.clearFilters}
          </Button>
        )}
      </form>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground mr-1">{t.tagsLabel}</span>
          {tags.map(({ tag, count }) => {
            const active = initialTag.toLowerCase() === tag.toLowerCase()
            return (
              <Badge
                key={tag}
                variant={active ? 'default' : 'secondary'}
                className="cursor-pointer text-xs font-normal"
                onClick={() => navigate({
                  tag: active ? '' : tag,
                  page: 1,
                })}
              >
                {tag}
                <span className="ml-1 opacity-70">{count}</span>
              </Badge>
            )
          })}
        </div>
      )}

      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          {t.activeFilters}
          {initialQ ? ` · ${t.filterKeyword.replace('{q}', initialQ)}` : ''}
          {initialTag ? ` · ${t.filterTag.replace('{tag}', initialTag)}` : ''}
        </p>
      )}
    </div>
  )
}
