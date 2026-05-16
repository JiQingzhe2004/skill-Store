import { Prisma, SkillStatus, SkillVisibility } from '@prisma/client'

export type PublicSkillSort = 'updated' | 'downloads' | 'stars' | 'likes' | 'name'

export type PublicSkillsFilter = {
  q?: string
  tag?: string
  sort?: PublicSkillSort
}

const PUBLIC_BASE_WHERE: Prisma.SkillWhereInput = {
  status: SkillStatus.PUBLISHED,
  visibility: SkillVisibility.PUBLIC,
}

export function parseTagsCsv(tags: string): string[] {
  if (!tags.trim()) return []
  return tags.split(',').map(t => t.trim()).filter(Boolean)
}

export function buildTagMatch(tag: string): Prisma.SkillWhereInput {
  const normalized = tag.trim()
  if (!normalized) return {}

  return {
    OR: [
      { tags: normalized },
      { tags: { startsWith: `${normalized},` } },
      { tags: { endsWith: `,${normalized}` } },
      { tags: { contains: `,${normalized},` } },
    ],
  }
}

export function buildPublicSkillsWhere(filter: PublicSkillsFilter = {}): Prisma.SkillWhereInput {
  const q = filter.q?.trim()
  const tag = filter.tag?.trim()

  const clauses: Prisma.SkillWhereInput[] = [PUBLIC_BASE_WHERE]

  if (q) {
    clauses.push({
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { slug: { contains: q } },
        { tags: { contains: q } },
      ],
    })
  }

  if (tag) {
    clauses.push(buildTagMatch(tag))
  }

  return clauses.length === 1 ? PUBLIC_BASE_WHERE : { AND: clauses }
}

export function buildPublicSkillsOrderBy(sort: PublicSkillSort = 'updated'): Prisma.SkillOrderByWithRelationInput {
  switch (sort) {
    case 'downloads':
      return { downloadCount: 'desc' }
    case 'stars':
      return { starCount: 'desc' }
    case 'likes':
      return { likeCount: 'desc' }
    case 'name':
      return { name: 'asc' }
    case 'updated':
    default:
      return { updatedAt: 'desc' }
  }
}

export function normalizePublicSkillSort(sort?: string): PublicSkillSort {
  if (sort === 'downloads' || sort === 'stars' || sort === 'likes' || sort === 'name') {
    return sort
  }
  return 'updated'
}

export function aggregateTagsFromSkills(skills: { tags: string }[], limit = 24) {
  const counts = new Map<string, number>()

  for (const skill of skills) {
    for (const tag of parseTagsCsv(skill.tags)) {
      const key = tag.toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}
