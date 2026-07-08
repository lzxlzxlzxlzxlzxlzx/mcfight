import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_slime_beetle' as const

export const RAW: RawMonsterRow = [
  '粘液甲虫',
  12,
  '地面，远程粘液球攻击',
  '25',
  '8',
  '0',
  'twilightforest:slime_beetle',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
