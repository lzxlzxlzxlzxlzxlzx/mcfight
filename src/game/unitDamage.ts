import { MONSTER_MAP } from '../data/monsters'
import { getDamageAfterArmor } from './damage'
import type { BattleUnit } from './types'

export type DamageCategory = 'melee' | 'ranged'

const KOBO_RANGED_BLOCK_TAG = 'kobo_block_ranged'

export function isKobolediator(unit: BattleUnit | string): boolean {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === 'cataclysm_kobolediator'
}

/** 结算入站伤害（护甲 + 骸骨斩首者远程格挡） */
export function dealDamageToUnit(
  target: BattleUnit,
  rawDamage: number,
  category: DamageCategory = 'melee',
): number {
  let dmg = rawDamage
  const def = MONSTER_MAP[target.monsterId]
  if (category === 'ranged' && def?.tags.includes(KOBO_RANGED_BLOCK_TAG)) {
    dmg *= 0.5
  }
  return getDamageAfterArmor(dmg, target.armor, def?.armorToughness ?? 0)
}

export function hurtUnit(
  target: BattleUnit,
  rawDamage: number,
  category: DamageCategory = 'melee',
): boolean {
  target.hp -= dealDamageToUnit(target, rawDamage, category)
  if (target.hp <= 0) {
    target.state = 'dead'
    return true
  }
  return false
}
