import { SkillStatus, SkillVisibility } from '@prisma/client'

export function canReadSkill(
  skill: { status: SkillStatus; visibility: SkillVisibility; authorId: string },
  apiClientOwnerId: string,
) {
  if (skill.status !== SkillStatus.PUBLISHED) return false
  if (skill.visibility === SkillVisibility.PRIVATE && skill.authorId !== apiClientOwnerId) return false
  return true
}
