import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_naga' as const

export const RAW: RawMonsterRow = [
  '娜迦',
  120,
  '地面，快速移动，荆棘反伤',
  '200',
  '6',
  '0',
  'twilightforest:naga',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
