import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'

export const ID = 'alexscaves_tremorzilla' as const

export const RAW: RawMonsterRow = [
  '撼地斯拉',
  1000,
  'boss，地面，范围攻击，超能射线，辐照',
  '500',
  '30',
  '10',
  'alexscaves:tremorzilla',
]

export function createDef(): MonsterDef {
  const base = buildMonster(...RAW)
  return {
    ...base,
    attackType: 'melee',
    attackRange: 58,
    attackInterval: 1.0,
    tags: [...base.tags, 'giant', 'beam_skill'],
  }
}
