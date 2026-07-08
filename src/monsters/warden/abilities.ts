import type { BattleUnit, ShockwaveEffect } from '../../game/types'
import { dealDamageToUnit } from '../../game/unitDamage'
import { getWardenConfig } from './config'
import { spawnShockwave } from '../_shared/combatEffects'

export const WARDEN_ID = 'warden'

function cfg() {
  return getWardenConfig()
}

export function isWarden(unit: BattleUnit | string) {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === WARDEN_ID
}

export function initWardenState(unit: BattleUnit) {
  unit.skillCooldown = 0
  unit.attackInterval = cfg().meleeInterval
  unit.baseAttackInterval = cfg().meleeInterval
}

export function wardenEngageRange() {
  const c = cfg()
  return Math.max(c.meleeRange, c.rangedRange)
}

export function wardenRangedAttack(
  unit: BattleUnit,
  target: BattleUnit,
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  target.hp -= dealDamageToUnit(target, c.rangedDamage, 'ranged')
  if (target.hp <= 0) target.state = 'dead'

  const mx = (unit.x + target.x) / 2
  const my = (unit.y + target.y) / 2
  spawnShockwave(shockwaves, unit.team, mx, my, 52, 0.35)
  unit.attackAnimTimer = 0.45
  unit.facing = target.x >= unit.x ? 1 : -1
}

export function wardenMeleeAttack(unit: BattleUnit, target: BattleUnit) {
  const c = cfg()
  target.hp -= dealDamageToUnit(target, c.meleeDamage, 'melee')
  if (target.hp <= 0) target.state = 'dead'
  unit.attackAnimTimer = 0.3
  unit.facing = target.x >= unit.x ? 1 : -1
}
