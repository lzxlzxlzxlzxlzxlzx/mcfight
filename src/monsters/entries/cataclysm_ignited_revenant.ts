import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_ignited_revenant' as const

export const RAW: RawMonsterRow = [
  '炽燃遗魂',
  180,
  '地面，旋转范围火焰攻击，自身攻击时盾牌格挡攻击（无法格挡爆炸和激光）',
  '80',
  '6',
  '12',
  'cataclysm:ignited_revenant',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
