import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_rhinoceros' as const

export const RAW: RawMonsterRow = [
  '犀牛',
  50,
  '地面，冲锋单体攻击',
  '60',
  '8',
  '12',
  'alexsmobs:rhinoceros',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
