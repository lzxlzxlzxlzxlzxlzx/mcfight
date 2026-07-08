import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_tremorsaurus' as const

export const RAW: RawMonsterRow = [
  '撼地龙',
  200,
  '地面，单体高攻击，范围恐吓怒吼，咬住小型敌人',
  '150',
  '14',
  '8',
  'alexscaves:tremorsaurus',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
