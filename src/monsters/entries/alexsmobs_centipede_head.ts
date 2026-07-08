import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexsmobs_centipede_head' as const

export const RAW: RawMonsterRow = [
  '洞穴蜈蚣',
  30,
  '地面，多节，毒性攻击',
  '35',
  '8',
  '6',
  'alexsmobs:centipede_head',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
