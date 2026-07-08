import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_fire_beetle' as const

export const RAW: RawMonsterRow = [
  '喷火甲虫',
  6,
  '地面，火焰吐息',
  '25',
  '4',
  '0',
  'twilightforest:fire_beetle',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
