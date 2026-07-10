import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getCyclopsConfig } from './config'

export const ID = 'iceandfire_cyclops' as const

export const RAW: RawMonsterRow = [
  '独眼巨人',
  150,
  '地面，吞噬对小型单位造成巨额伤害',
  '150',
  '17',
  '20',
  'iceandfire:cyclops',
]

export function createDef(): MonsterDef {
  const c = getCyclopsConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.slamDamage,
    attackType: 'melee',
    attackRange: c.devourRange,
    attackInterval: c.slamInterval,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [...base.tags.filter((t) => t !== 'aoe_melee'), 'cyclops_special'],
  }
}
