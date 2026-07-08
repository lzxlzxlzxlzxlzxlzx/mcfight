import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'evoker' as const

export const RAW: RawMonsterRow = [
  '唤魔者',
  50,
  '地面，远程攻击，召唤恼鬼',
  '24',
  '6',
  '0',
  'evoker',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
