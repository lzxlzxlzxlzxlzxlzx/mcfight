import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_the_harbinger' as const

export const RAW: RawMonsterRow = [
  '先驱者',
  600,
  'boss，飞行，激光射击，导弹攻击',
  '390',
  '5至27.5',
  '12',
  'cataclysm:the_harbinger',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
