import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'creeper' as const

export const RAW: RawMonsterRow = [
  '苦力怕',
  20,
  '地面，自爆',
  '20',
  '中心49',
  '0',
  'creeper',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
