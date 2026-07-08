import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'mowziesmobs_naga' as const

export const RAW: RawMonsterRow = [
  '娜迦（飞行）',
  10,
  '飞行，滑翔冲锋/毒液喷射',
  '30',
  '4',
  '0',
  'mowziesmobs:naga',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
