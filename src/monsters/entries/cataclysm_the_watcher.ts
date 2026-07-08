import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_the_watcher' as const

export const RAW: RawMonsterRow = [
  '观测者',
  25,
  '地面，远程火焰攻击',
  '25',
  '4',
  '5',
  'cataclysm:the_watcher',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
