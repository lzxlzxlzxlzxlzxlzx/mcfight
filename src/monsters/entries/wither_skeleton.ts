import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'wither_skeleton' as const

export const RAW: RawMonsterRow = [
  '凋零骷髅',
  8,
  '地面，近战单体，攻击附带凋零',
  '20',
  '8',
  '0',
  'wither_skeleton',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
