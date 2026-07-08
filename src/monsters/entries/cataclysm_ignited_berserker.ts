import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_ignited_berserker' as const

export const RAW: RawMonsterRow = [
  '炽燃狂魂',
  60,
  '地面，范围火焰攻击',
  '65',
  '11至14',
  '8',
  'cataclysm:ignited_berserker',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
