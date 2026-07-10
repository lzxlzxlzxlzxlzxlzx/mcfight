import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { CORAL_LEAP_TAG } from '../_shared/coralLeap'
import { getCoralGolemConfig } from './config'

export const ID = 'cataclysm_coral_golem' as const

export const RAW: RawMonsterRow = [
  '珊瑚傀儡',
  80,
  '地面，跃击范围攻击',
  '110',
  '11至14',
  '5',
  'cataclysm:coral_golem',
]

export function createDef(): MonsterDef {
  const c = getCoralGolemConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.leapDamage,
    attackRange: c.leapMaxRange,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    attackInterval: c.attackInterval,
    tags: [...base.tags.filter((t) => t !== 'aoe_melee'), CORAL_LEAP_TAG],
  }
}
