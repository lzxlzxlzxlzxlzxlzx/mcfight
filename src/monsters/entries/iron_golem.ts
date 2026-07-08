import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'iron_golem' as const

export const RAW: RawMonsterRow = [
  '铁傀儡',
  100,
  '地面，单体攻击，击飞',
  '100',
  '7.5至21.5',
  '0',
  'iron_golem',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
