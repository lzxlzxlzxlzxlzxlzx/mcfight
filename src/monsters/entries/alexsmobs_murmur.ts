import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_murmur' as const

export const RAW: RawMonsterRow = [
  '轻语灵',
  25,
  '地面，远程，头部受伤减半',
  '15',
  '5',
  '0',
  'alexsmobs:murmur',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
