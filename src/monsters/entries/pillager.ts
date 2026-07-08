import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'pillager' as const

export const RAW: RawMonsterRow = [
  '掠夺者',
  6,
  '地面，远程',
  '24',
  '4',
  '0',
  'pillager',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
