import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getKobolediatorConfig } from './config'

export const ID = 'cataclysm_kobolediator' as const

export const RAW: RawMonsterRow = [
  '骸骨斩首者',
  250,
  '地面，范围攻击，冲锋斩击，格挡远程攻击',
  '180',
  '14至17.5',
  '10',
  'cataclysm:kobolediator',
]

export function createDef(): MonsterDef {
  const c = getKobolediatorConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.tripleSlashDamage,
    attackType: 'melee',
    attackRange: c.engageRange,
    attackInterval: c.tripleCastDuration,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [...base.tags, 'kobo_boss', 'kobo_block_ranged'],
  }
}
