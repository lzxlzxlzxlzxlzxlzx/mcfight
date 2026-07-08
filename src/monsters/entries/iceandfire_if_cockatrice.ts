import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'iceandfire_if_cockatrice' as const

export const RAW: RawMonsterRow = [
  '鸡蛇',
  20,
  '地面，远程精准凋零瞪视',
  '40',
  '2',
  '2',
  'iceandfire:if_cockatrice',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
