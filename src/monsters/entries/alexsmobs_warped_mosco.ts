import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_warped_mosco' as const

export const RAW: RawMonsterRow = [
  '诡异蚊鬼',
  180,
  '飞行，近战攻击，吸血，20%血以下变为高机动远程攻击',
  '100',
  '10（远程7）',
  '10',
  'alexsmobs:warped_mosco',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
