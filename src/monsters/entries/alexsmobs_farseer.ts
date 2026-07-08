import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_farseer' as const

export const RAW: RawMonsterRow = [
  '瞻远者',
  120,
  '飞行，百分比伤害，克制高血量单位',
  '70',
  '6（激光10%最大生命）',
  '6',
  'alexsmobs:farseer',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
