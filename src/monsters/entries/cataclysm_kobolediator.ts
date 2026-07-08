import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_kobolediator' as const

export const RAW: RawMonsterRow = [
  '骸骨斩首者',
  250,
  '地面，范围攻击，冲锋斩击，格挡远程攻击',
  '180',
  '14至17.5',
  '10',
  'cataclysm:kobolediator',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
