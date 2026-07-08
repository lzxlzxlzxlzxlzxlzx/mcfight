import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_elephant' as const

export const RAW: RawMonsterRow = [
  '大象',
  80,
  '地面，冲锋单体攻击，部分突变有长牙',
  '85（长牙110）',
  '10（长牙15）/冲锋25',
  '0',
  'alexsmobs:elephant',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
