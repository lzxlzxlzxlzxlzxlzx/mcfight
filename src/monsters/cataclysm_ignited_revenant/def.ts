import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getIgnitedRevenantConfig } from './config'

export const ID = 'cataclysm_ignited_revenant' as const

export const RAW: RawMonsterRow = [
  '炽燃遗魂',
  180,
  '地面，旋转范围火焰攻击，火焰免疫，防御时格挡远程/激光/爆炸等伤害，近战减免90%',
  '80',
  '6',
  '12',
  'cataclysm:ignited_revenant',
]

export function createDef(): MonsterDef {
  const c = getIgnitedRevenantConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.spinDamage,
    attackRange: Math.max(c.spinRadius, c.breathRange, c.bonesRange),
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [
      ...base.tags.filter((t) => t !== 'aoe_melee'),
      'fire_immune',
      'revenant_special',
    ],
  }
}
