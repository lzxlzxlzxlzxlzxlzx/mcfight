import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'

export const ID = 'alexscaves_luxtructosaurus' as const

export const RAW: RawMonsterRow = [
  '暝煌龙',
  800,
  'boss,地面，范围攻击，陨石雨，火焰免疫',
  '600',
  '12',
  '20',
  'alexscaves:luxtructosaurus',
]

export function createDef(): MonsterDef {
  const base = buildMonster(...RAW)
  return {
    ...base,
    attackType: 'melee',
    attackRange: 55,
    attackInterval: 2.2,
    moveSpeed: 24,
    tags: [
      ...base.tags.filter((t) => t !== 'aoe_melee'),
      'lux_boss',
      'giant',
      'fire_immune',
      'meteor_passive',
    ],
  }
}
