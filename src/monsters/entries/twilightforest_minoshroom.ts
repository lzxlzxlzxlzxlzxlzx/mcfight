import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_minoshroom' as const

export const RAW: RawMonsterRow = [
  '米诺菇',
  50,
  '地面，冲锋单体攻击',
  '160',
  '7',
  '0',
  'twilightforest:minoshroom',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
