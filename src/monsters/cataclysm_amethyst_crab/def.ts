import { buildMonster, type RawMonsterRow } from '../infer'
import type { MonsterDef } from '../../game/types'
import { getAmethystCrabConfig } from './config'

export const ID = 'cataclysm_amethyst_crab' as const

export const RAW: RawMonsterRow = [
  '紫水晶巨蟹',
  180,
  '地面，缩地时坚硬甲壳免疫伤害，破土而出范围攻击',
  '200',
  '15至16',
  '10',
  'cataclysm:amethyst_crab',
]

export function createDef(): MonsterDef {
  const c = getAmethystCrabConfig()
  const base = buildMonster(...RAW)
  return {
    ...base,
    hp: c.hp,
    armor: c.armor,
    attack: c.damage,
    attackRange: c.emergeRange,
    moveSpeed: c.moveSpeed,
    radius: c.radius,
    tags: [...base.tags.filter((t) => t !== 'aoe_melee'), 'amethyst_crab_special'],
  }
}
