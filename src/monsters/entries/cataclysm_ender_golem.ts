import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_ender_golem' as const

export const RAW: RawMonsterRow = [
  '末影傀儡',
  200,
  '地面，超大范围攻击',
  '120',
  '10至16',
  '12',
  'cataclysm:ender_golem',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
