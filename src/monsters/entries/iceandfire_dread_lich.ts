import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'iceandfire_dread_lich' as const

export const RAW: RawMonsterRow = [
  '悚怖尸巫',
  100,
  '地面，远程，不断召唤各种魔物，击杀的敌人也会变成魔物',
  '50',
  '6',
  '2',
  'iceandfire:dread_lich',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
