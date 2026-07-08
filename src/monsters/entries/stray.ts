import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'stray' as const

export const RAW: RawMonsterRow = [
  '流浪者',
  9,
  '地面，远程，攻击附带减速',
  '20',
  '1至5',
  '0',
  'stray',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
