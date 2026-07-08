import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'ravager' as const

export const RAW: RawMonsterRow = [
  '劫掠兽',
  70,
  '地面，单体攻击',
  '100',
  '12',
  '0',
  'ravager',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
