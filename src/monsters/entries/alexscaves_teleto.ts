import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_teleto' as const

export const RAW: RawMonsterRow = [
  '磁流灵',
  25,
  '飞行，远程攻击',
  '18',
  '5至7',
  '0',
  'alexscaves:teleto',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
