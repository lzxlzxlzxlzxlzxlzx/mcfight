import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_tarantula_hawk' as const

export const RAW: RawMonsterRow = [
  '沙漠蛛蜂',
  15,
  '飞行，蛰晕节肢生物（包括诡异蚊鬼，所有甲虫，所有蜘蛛）',
  '18',
  '5',
  '4',
  'alexsmobs:tarantula_hawk',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
