import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'iceandfire_stymphalianbird' as const

export const RAW: RawMonsterRow = [
  '铜羽泽鹗',
  15,
  '飞行，高速中距离射击，无视盔甲',
  '24',
  '1×2',
  '4',
  'iceandfire:stymphalianbird',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
