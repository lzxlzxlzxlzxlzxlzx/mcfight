import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getWardenConfig } from './config'

export const ID = 'warden' as const

export const RAW: RawMonsterRow = [
  '监守者',
  400,
  '地面，高速，单体近战高攻击，远程声波',
  '500',
  '30（远程10）',
  '0',
  'warden',
]

export function createDef(): MonsterDef {
  const c = getWardenConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.meleeDamage,
    attackType: 'melee',
    attackRange: c.meleeRange,
    attackInterval: c.meleeInterval,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [...base.tags, 'warden_special'],
  }
}
