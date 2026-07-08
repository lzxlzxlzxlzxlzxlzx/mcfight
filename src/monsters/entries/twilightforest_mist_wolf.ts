import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_mist_wolf' as const

export const RAW: RawMonsterRow = [
  '迷雾狼',
  13,
  '地面，近战',
  '30',
  '4',
  '0',
  'twilightforest:mist_wolf',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
