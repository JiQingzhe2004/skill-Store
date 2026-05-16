import { SkillStatus, SkillVisibility } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import { canReadSkill } from './public-api.access'

describe('canReadSkill', () => {
  const publishedPublic = {
    status: SkillStatus.PUBLISHED,
    visibility: SkillVisibility.PUBLIC,
    authorId: 'author-1',
  }

  it('allows published public skills', () => {
    expect(canReadSkill(publishedPublic, 'any-user')).toBe(true)
  })

  it('allows published unlisted skills with any api key', () => {
    expect(
      canReadSkill(
        { ...publishedPublic, visibility: SkillVisibility.UNLISTED },
        'other-user',
      ),
    ).toBe(true)
  })

  it('allows private skills only for owner api key', () => {
    const priv = { ...publishedPublic, visibility: SkillVisibility.PRIVATE }
    expect(canReadSkill(priv, 'author-1')).toBe(true)
    expect(canReadSkill(priv, 'other-user')).toBe(false)
  })

  it('denies draft or archived skills', () => {
    expect(canReadSkill({ ...publishedPublic, status: SkillStatus.DRAFT }, 'author-1')).toBe(false)
    expect(canReadSkill({ ...publishedPublic, status: SkillStatus.ARCHIVED }, 'author-1')).toBe(false)
  })
})
