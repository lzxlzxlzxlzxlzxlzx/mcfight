import { MONSTER_MAP } from '../data/monsters'
import { isAmethystCrabBurrowed } from '../monsters/cataclysm_amethyst_crab/abilities'
import { isRevenantDefending } from '../monsters/cataclysm_ignited_revenant/abilities'
import { getDamageAfterArmor } from './damage'
import type { BattleUnit } from './types'

export type DamageCategory = 'melee' | 'ranged' | 'beam' | 'explosion'

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
  if (isAmethystCrabBurrowed(target)) return 0
  let dmg = rawDamage
  const def = MONSTER_MAP[target.monsterId]
  if (def?.tags.includes('revenant_special') && isRevenantDefending(target)) {
    if (category === 'melee') dmg *= 0.1
    else return 0
  }
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
