import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'warden' as const

export const RAW: RawMonsterRow = [
  '监守者',
  400,
  '地面，高速，单体近战高攻击，远程声波',
  '500',
  '30（远程10）',
  '0',
  'warden',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
