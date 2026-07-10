import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getWarpedMoscoConfig } from './config'

export const ID = 'alexsmobs_warped_mosco' as const

export const RAW: RawMonsterRow = [
  '诡异蚊鬼',
  180,
  '地面，近战攻击，吸血，25血以下变为高机动远程攻击',
  '100',
  '10（远程7）',
  '10',
  'alexsmobs:warped_mosco',
]

export function createDef(): MonsterDef {
  const c = getWarpedMoscoConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.punchDamage,
    moveType: 'ground',
    attackType: 'melee',
    attackRange: c.meleeRange,
    attackInterval: c.skillInterval,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [...base.tags.filter((t) => t !== 'fly'), 'mosco_special', 'arthropod'],
  }
}
