import type { BattleUnit, ShockwaveEffect } from '../../game/types'
import { isWithinCastRange } from '../../game/unitCombat'
import { aoeDamageAtCenter, spawnShockwave } from '../_shared/combatEffects'
import { getCyclopsConfig } from './config'

export const CYCLOPS_ID = 'iceandfire_cyclops'

export type CyclopsAction = 'devour' | 'slam'

function cfg() {
  return getCyclopsConfig()
}

export function isSmallUnit(unit: BattleUnit): boolean {
  return unit.maxHp <= cfg().smallMaxHp
}

/** 独眼巨人可锁定的目标：小型（含飞行）或大型地面 */
export function canCyclopsTargetEnemy(target: BattleUnit): boolean {
  if (isSmallUnit(target)) return true
  return target.moveType === 'ground'
}

export function initCyclopsState(_unit: BattleUnit) {}

export function cyclopsEngageRange() {
  return cfg().devourRange
}

export function pickCyclopsAction(target: BattleUnit): CyclopsAction {
  return isSmallUnit(target) ? 'devour' : 'slam'
}

export function isCyclopsActionInRange(
  action: CyclopsAction,
  _unit: BattleUnit,
  target: BattleUnit,
  dist: number,
): boolean {
  const c = cfg()
  if (action === 'devour') {
    return isWithinCastRange(dist, c.devourRange, target)
  }
  return isWithinCastRange(dist, c.devourRange, target) && target.moveType === 'ground'
}

/** 瞬间吞噬小型目标，之后 3 秒内无法再次攻击 */
export function executeCyclopsDevour(unit: BattleUnit, target: BattleUnit) {
  const c = cfg()
  unit.state = 'attack'
  unit.facing = target.x >= unit.x ? 1 : -1
  target.hp = 0
  target.state = 'dead'
  unit.attackCooldown = c.devourRecovery
  unit.attackAnimTimer = 0.35
}

export function executeCyclopsSlam(
  unit: BattleUnit,
  target: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  unit.state = 'attack'
  unit.facing = target.x >= unit.x ? 1 : -1
  aoeDamageAtCenter(unit, target.x, target.y, c.slamRadius, units, c.slamDamage)
  spawnShockwave(shockwaves, unit.team, target.x, target.y, c.slamRadius * 0.85, 0.38)
  unit.attackAnimTimer = 0.4
  unit.attackCooldown = c.slamInterval
}
