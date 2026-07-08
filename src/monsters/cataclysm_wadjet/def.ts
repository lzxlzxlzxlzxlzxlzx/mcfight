import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getWadjetConfig } from './config'

export const ID = 'cataclysm_wadjet' as const

export const RAW: RawMonsterRow = [
  '瓦吉特',
  150,
  '地面，大范围攻击，召唤沙漠石碑，召唤沙龙卷，强力对空',
  '150',
  '11，石碑18',
  '5',
  'cataclysm:wadjet',
]

export function createDef(): MonsterDef {
  const c = getWadjetConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.sweepDamage,
    attackType: 'melee',
    attackRange: c.engageRange,
    attackInterval: c.skillCastDuration,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [...base.tags.filter((t) => t !== 'summoner'), 'wadjet_boss', 'aoe_melee'],
  }
}
