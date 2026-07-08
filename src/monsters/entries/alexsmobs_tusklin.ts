import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_tusklin' as const

export const RAW: RawMonsterRow = [
  '獠牙兽',
  30,
  '地面',
  '40',
  '9',
  '0',
  'alexsmobs:tusklin',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
