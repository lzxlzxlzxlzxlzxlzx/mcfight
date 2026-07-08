import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'iceandfire_if_troll' as const

export const RAW: RawMonsterRow = [
  '食人妖',
  60,
  '地面，重击范围攻击，免疫击退和远程伤害',
  '50',
  '10（重击27）',
  '9',
  'iceandfire:if_troll',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
