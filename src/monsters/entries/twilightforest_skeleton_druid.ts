import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_skeleton_druid' as const

export const RAW: RawMonsterRow = [
  '骷髅德鲁伊',
  5,
  '地面，远程，攻击附带中毒',
  '20',
  '2',
  '0',
  'twilightforest:skeleton_druid',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
