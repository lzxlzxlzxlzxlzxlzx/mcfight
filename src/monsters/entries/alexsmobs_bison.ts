import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_bison' as const

export const RAW: RawMonsterRow = [
  '野牛',
  30,
  '地面，近战单体，超远击退',
  '40',
  '8',
  '0',
  'alexsmobs:bison',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
