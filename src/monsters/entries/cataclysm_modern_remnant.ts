import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_modern_remnant' as const

export const RAW: RawMonsterRow = [
  '现世遗魂',
  80,
  '地面，快速单体攻击',
  '120',
  '6',
  '5',
  'cataclysm:modern_remnant',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
