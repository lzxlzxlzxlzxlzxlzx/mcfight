import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_deepling' as const

export const RAW: RawMonsterRow = [
  '渊灵',
  25,
  '地面，远程/近战',
  '26',
  '远程6.5 近战9.5',
  '0',
  'cataclysm:deepling',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
