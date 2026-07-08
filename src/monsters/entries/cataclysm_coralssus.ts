import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_coralssus' as const

export const RAW: RawMonsterRow = [
  '珊瑚巨兽',
  150,
  '地面，跃击范围攻击',
  '150',
  '10至13',
  '5',
  'cataclysm:coralssus',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
