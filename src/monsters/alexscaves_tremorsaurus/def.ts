import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getTremorsaurusConfig } from './config'

export const ID = 'alexscaves_tremorsaurus' as const

export const RAW: RawMonsterRow = [
  '撼地龙',
  200,
  '地面，单体高攻击，范围恐吓怒吼，咬住小型敌人',
  '150',
  '14',
  '8',
  'alexscaves:tremorsaurus',
]

export function createDef(): MonsterDef {
  const c = getTremorsaurusConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    attack: c.attack,
    armor: c.armor,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    attackRange: c.attackRange,
    attackInterval: c.attackInterval,
    attackType: 'melee',
    tags: [...base.tags.filter((t) => t !== 'aoe_melee'), 'tremorsaurus_special'],
  }
}
