import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_vallumraptor' as const

export const RAW: RawMonsterRow = [
  '阔鼻迅猛龙',
  8,
  '地面，冲锋',
  '28至32',
  '3',
  '0',
  'alexscaves:vallumraptor',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
