import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_winter_wolf' as const

export const RAW: RawMonsterRow = [
  '寒冬狼',
  16,
  '地面，寒冰吐息',
  '30',
  '4',
  '0',
  'twilightforest:winter_wolf',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
