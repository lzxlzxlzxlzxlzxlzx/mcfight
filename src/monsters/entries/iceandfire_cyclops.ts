import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'iceandfire_cyclops' as const

export const RAW: RawMonsterRow = [
  '独眼巨人',
  150,
  '地面，吞噬对小型单位造成巨额伤害',
  '150',
  '17',
  '20',
  'iceandfire:cyclops',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
