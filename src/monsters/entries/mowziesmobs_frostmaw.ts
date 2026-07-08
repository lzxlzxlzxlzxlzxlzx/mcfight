import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'mowziesmobs_frostmaw' as const

export const RAW: RawMonsterRow = [
  '霜冻巨兽',
  150,
  '地面，范围寒冰吐息，重击高伤害',
  '250',
  '8（重击50）',
  '0',
  'mowziesmobs:frostmaw',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
