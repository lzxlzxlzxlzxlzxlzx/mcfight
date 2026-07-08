import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_deepling_warlock' as const

export const RAW: RawMonsterRow = [
  '渊灵术士',
  50,
  '地面，高延迟召唤高伤害激光雨',
  '45',
  '每段14，共7段',
  '0',
  'cataclysm:deepling_warlock',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
