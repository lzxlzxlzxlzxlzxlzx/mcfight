import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_koboleton' as const

export const RAW: RawMonsterRow = [
  '骷髅狗头人',
  15,
  '地面，冲锋',
  '25',
  '7',
  '0',
  'cataclysm:koboleton',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
