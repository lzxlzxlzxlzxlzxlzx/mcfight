import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'witch' as const

export const RAW: RawMonsterRow = [
  '女巫',
  20,
  '地面，伤害/剧毒/虚弱/迟缓药水投掷',
  '26',
  '4',
  '0',
  'witch',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
