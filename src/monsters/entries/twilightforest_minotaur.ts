import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_minotaur' as const

export const RAW: RawMonsterRow = [
  '牛头人',
  16,
  '地面，高速高伤害单体',
  '30',
  '8',
  '0',
  'twilightforest:minotaur',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
