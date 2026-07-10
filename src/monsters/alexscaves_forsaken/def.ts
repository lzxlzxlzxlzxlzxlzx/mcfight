import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getForsakenConfig } from './config'
import { forsakenEngageRange } from './abilities'

export const ID = 'alexscaves_forsaken' as const

export const RAW: RawMonsterRow = [
  '遗弃者',
  150,
  '地面，范围攻击，快速跳跃，声波攻击',
  '250',
  '6',
  '0',
  'alexscaves:forsaken',
]

export function createDef(): MonsterDef {
  const c = getForsakenConfig()
  const base = buildMonster(...RAW)
  const engage = forsakenEngageRange()
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.biteDamage,
    attackRange: engage,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    attackInterval: c.attackInterval,
    tags: [...base.tags.filter((t) => t !== 'aoe_melee'), 'forsaken_special'],
  }
}
