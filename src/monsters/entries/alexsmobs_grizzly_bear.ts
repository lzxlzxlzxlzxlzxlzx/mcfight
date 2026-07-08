import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_grizzly_bear' as const

export const RAW: RawMonsterRow = [
  '灰熊',
  40,
  '地面，单体攻击',
  '55',
  '8',
  '0',
  'alexsmobs:grizzly_bear',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
