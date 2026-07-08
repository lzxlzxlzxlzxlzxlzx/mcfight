import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_tower_golem' as const

export const RAW: RawMonsterRow = [
  '砷铅铁傀儡',
  30,
  '地面，近战单体，击飞',
  '40',
  '9',
  '0',
  'twilightforest:tower_golem',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
