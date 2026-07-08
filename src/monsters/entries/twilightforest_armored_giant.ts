import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_armored_giant' as const

export const RAW: RawMonsterRow = [
  '武装巨人',
  120,
  '地面，重甲单体攻击',
  '80',
  '6',
  '15',
  'twilightforest:armored_giant',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
