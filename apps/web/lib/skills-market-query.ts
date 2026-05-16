export type SkillsMarketQuery = {
  page?: number
  q?: string
  tag?: string
  sort?: string
}

export function buildSkillsMarketQuery(params: SkillsMarketQuery) {
  const sp = new URLSearchParams()
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.tag?.trim()) sp.set('tag', params.tag.trim())
  if (params.sort && params.sort !== 'updated') sp.set('sort', params.sort)
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export function buildSkillsMarketApiQuery(params: SkillsMarketQuery) {
  return buildSkillsMarketQuery(params).replace(/^\?/, '')
}
