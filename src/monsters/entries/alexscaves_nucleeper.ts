import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_nucleeper' as const

export const RAW: RawMonsterRow = [
  '核能苦力怕',
  100,
  '地面，超长延迟超高伤害自爆（不分敌我），辐照',
  '30',
  '中心1400',
  '4',
  'alexscaves:nucleeper',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
