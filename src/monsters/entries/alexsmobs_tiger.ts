import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_tiger' as const

export const RAW: RawMonsterRow = [
  '老虎',
  40,
  '地面，冲锋单体攻击',
  '50',
  '6',
  '0',
  'alexsmobs:tiger',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
