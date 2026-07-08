import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_king_spider' as const

export const RAW: RawMonsterRow = [
  '国王蜘蛛',
  12,
  '地面，由远程攻击的骷髅德鲁伊骑乘',
  '30',
  '6',
  '0',
  'twilightforest:king_spider',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
