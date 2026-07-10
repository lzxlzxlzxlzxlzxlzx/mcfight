import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getEnderGolemConfig } from './config'

export const ID = 'cataclysm_ender_golem' as const

export const RAW: RawMonsterRow = [
  '末影傀儡',
  200,
  '地面，超大范围攻击',
  '120',
  '10至16',
  '12',
  'cataclysm:ender_golem',
]

export function createDef(): MonsterDef {
  const c = getEnderGolemConfig()
  const base = buildMonster(...RAW)
  const avgAttack = (c.punchDamageMin + c.slamDamageMax) / 2
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: avgAttack,
    attackType: 'melee',
    attackRange: c.punchRange,
    attackInterval: c.attackInterval,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [...base.tags.filter((t) => t !== 'aoe_melee'), 'ender_golem_boss'],
  }
}
