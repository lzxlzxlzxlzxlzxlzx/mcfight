import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_deep_one' as const

export const RAW: RawMonsterRow = [
  '深潜者',
  10,
  '地面，近战',
  '30',
  '3',
  '0',
  'alexscaves:deep_one',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
