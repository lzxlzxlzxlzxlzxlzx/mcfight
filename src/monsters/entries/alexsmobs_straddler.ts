import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_straddler' as const

export const RAW: RawMonsterRow = [
  '跨座兽',
  20,
  '地面，远程投掷蝌蚪',
  '28',
  '3',
  '5',
  'alexsmobs:straddler',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
