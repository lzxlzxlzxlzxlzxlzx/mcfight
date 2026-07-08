import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'blaze' as const

export const RAW: RawMonsterRow = [
  '烈焰人',
  10,
  '飞行，远程三连火焰球',
  '20',
  '5',
  '0',
  'blaze',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
