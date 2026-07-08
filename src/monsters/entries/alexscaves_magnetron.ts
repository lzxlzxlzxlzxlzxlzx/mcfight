import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_magnetron' as const

export const RAW: RawMonsterRow = [
  '磁控机兵',
  40,
  '地面，中距离范围攻击，击退小型单位',
  '80',
  '2',
  '6',
  'alexscaves:magnetron',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
