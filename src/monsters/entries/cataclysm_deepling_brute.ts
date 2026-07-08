import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_deepling_brute' as const

export const RAW: RawMonsterRow = [
  '渊灵蛮兵',
  60,
  '地面，近战/远程单体攻击',
  '60',
  '远程10，近战14',
  '8',
  'cataclysm:deepling_brute',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
