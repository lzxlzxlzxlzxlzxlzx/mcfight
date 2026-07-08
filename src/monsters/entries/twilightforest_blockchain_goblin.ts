import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_blockchain_goblin' as const

export const RAW: RawMonsterRow = [
  '链锤哥布林',
  20,
  '地面，中距离链锤攻击',
  '20',
  '8',
  '0',
  'twilightforest:blockchain_goblin',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
