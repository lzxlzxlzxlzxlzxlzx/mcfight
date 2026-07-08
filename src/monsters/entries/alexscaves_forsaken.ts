import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_forsaken' as const

export const RAW: RawMonsterRow = [
  '遗弃者',
  150,
  '地面，范围攻击，快速跳跃，声波攻击',
  '250',
  '6',
  '0',
  'alexscaves:forsaken',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
