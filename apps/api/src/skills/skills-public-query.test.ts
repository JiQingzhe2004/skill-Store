import { describe, expect, it } from 'vitest'

import {
  aggregateTagsFromSkills,
  buildPublicSkillsWhere,
  buildTagMatch,
  normalizePublicSkillSort,
  parseTagsCsv,
} from './skills-public-query'

describe('skills-public-query', () => {
  it('parses comma-separated tags', () => {
    expect(parseTagsCsv('github, 代码,效率')).toEqual(['github', '代码', '效率'])
  })

  it('builds search where with keyword', () => {
    const where = buildPublicSkillsWhere({ q: 'test' })
    expect(where).toHaveProperty('AND')
  })

  it('builds tag match patterns', () => {
    expect(buildTagMatch('github')).toEqual({
      OR: expect.arrayContaining([
        { tags: 'github' },
        { tags: { startsWith: 'github,' } },
      ]),
    })
  })

  it('normalizes sort values', () => {
    expect(normalizePublicSkillSort('downloads')).toBe('downloads')
    expect(normalizePublicSkillSort('invalid')).toBe('updated')
  })

  it('aggregates tag counts', () => {
    const tags = aggregateTagsFromSkills([
      { tags: 'github,代码' },
      { tags: 'github,效率' },
    ])
    expect(tags.find(t => t.tag === 'github')?.count).toBe(2)
  })
})
