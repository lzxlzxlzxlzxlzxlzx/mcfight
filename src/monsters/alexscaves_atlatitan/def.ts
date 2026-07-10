import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getAtlantitanConfig } from './config'

export const ID = 'alexscaves_atlatitan' as const

export const RAW: RawMonsterRow = [
  '擎天龙',
  200,
  '地面，高生命，范围攻击',
  '400',
  '8',
  '0',
  'alexscaves:atlatitan',
]

export function createDef(): MonsterDef {
  const c = getAtlantitanConfig()
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
    tags: [...base.tags, 'atlatitan_unit'],
  }
}
