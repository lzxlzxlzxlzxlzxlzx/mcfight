import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_deep_one_mage' as const

export const RAW: RawMonsterRow = [
  '深潜者法师',
  100,
  '飞行，大范围波浪攻击，将敌人困入水泡',
  '80',
  '4',
  '0',
  'alexscaves:deep_one_mage',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
