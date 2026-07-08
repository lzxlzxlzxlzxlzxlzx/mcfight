import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_atlatitan' as const

export const RAW: RawMonsterRow = [
  '擎天龙',
  200,
  '地面，高生命，范围攻击',
  '400',
  '8',
  '0',
  'alexscaves:atlatitan',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
