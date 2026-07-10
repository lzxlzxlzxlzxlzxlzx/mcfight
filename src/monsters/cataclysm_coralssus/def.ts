import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { CORAL_LEAP_TAG } from '../_shared/coralLeap'
import { getCoralssusConfig } from './config'

export const ID = 'cataclysm_coralssus' as const

export const RAW: RawMonsterRow = [
  '珊瑚巨兽',
  150,
  '地面，跃击范围攻击',
  '150',
  '10至13',
  '5',
  'cataclysm:coralssus',
]

export function createDef(): MonsterDef {
  const c = getCoralssusConfig()
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
