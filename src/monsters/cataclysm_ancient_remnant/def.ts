import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'

export const ID = 'cataclysm_ancient_remnant' as const

export const RAW: RawMonsterRow = [
  '远古遗魂',
  700,
  'boss，地面，范围攻击，沙暴，甩尾',
  '420',
  '11至34',
  '12',
  'cataclysm:ancient_remnant',
]

export function createDef(): MonsterDef {
  const base = buildMonster(...RAW)
  return {
    ...base,
    attackType: 'melee',
    attackRange: 55,
    attackInterval: 3,
    moveSpeed: 36,
    tags: [
      ...base.tags.filter((t) => t !== 'aoe_melee'),
      'remnant_boss',
      'giant',
    ],
  }
}
