import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'skeleton' as const

export const RAW: RawMonsterRow = [
  '骷髅',
  8,
  '地面，远程',
  '20',
  '1至5',
  '0',
  'skeleton',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
