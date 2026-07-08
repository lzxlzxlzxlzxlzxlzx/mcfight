import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_giant_miner' as const

export const RAW: RawMonsterRow = [
  '矿工巨人',
  100,
  '地面，单体攻击',
  '80',
  '4',
  '0',
  'twilightforest:giant_miner',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
