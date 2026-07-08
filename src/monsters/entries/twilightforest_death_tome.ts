import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_death_tome' as const

export const RAW: RawMonsterRow = [
  '死灵书',
  5,
  '飞行，远程',
  '30',
  '6',
  '0',
  'twilightforest:death_tome',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
