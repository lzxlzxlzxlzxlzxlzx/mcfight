import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_relicheirus' as const

export const RAW: RawMonsterRow = [
  '遗迹恐手龙',
  60,
  '地面，高血量',
  '120',
  '12',
  '0',
  'alexscaves:relicheirus',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
