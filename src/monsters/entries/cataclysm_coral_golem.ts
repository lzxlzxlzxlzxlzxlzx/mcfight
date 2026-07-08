import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_coral_golem' as const

export const RAW: RawMonsterRow = [
  '珊瑚傀儡',
  80,
  '地面，跃击范围攻击',
  '110',
  '11至14',
  '5',
  'cataclysm:coral_golem',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
