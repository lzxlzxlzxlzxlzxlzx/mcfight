import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'vindicator' as const

export const RAW: RawMonsterRow = [
  '卫道士',
  20,
  '地面，高速高伤害单体近战',
  '24',
  '13',
  '0',
  'vindicator',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
