import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_deepling_priest' as const

export const RAW: RawMonsterRow = [
  '渊灵祭司',
  35,
  '地面，中距离大范围攻击',
  '45',
  '8',
  '0',
  'cataclysm:deepling_priest',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
