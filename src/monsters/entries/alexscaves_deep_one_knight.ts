import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_deep_one_knight' as const

export const RAW: RawMonsterRow = [
  '深潜者骑士',
  35,
  '地面，近战单体攻击/远程投掷三叉戟',
  '60',
  '近战10，远程6',
  '0',
  'alexscaves:deep_one_knight',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
