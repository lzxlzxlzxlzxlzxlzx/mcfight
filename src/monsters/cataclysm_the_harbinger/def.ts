import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'

export const ID = 'cataclysm_the_harbinger' as const

export const RAW: RawMonsterRow = [
  '先驱者',
  600,
  'boss，飞行，激光射击，导弹攻击',
  '390',
  '5至27.5',
  '12',
  'cataclysm:the_harbinger',
]

export function createDef(): MonsterDef {
  const base = buildMonster(...RAW)
  return {
    ...base,
    attackType: 'ranged',
    attackRange: 240,
    attackInterval: 2,
    moveSpeed: 64,
    tags: [...base.tags, 'harbinger_boss', 'boss'],
    onHitEffects: [],
  }
}
