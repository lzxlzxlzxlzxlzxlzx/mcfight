import type { BattleUnit, ShockwaveEffect } from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { clampLeapDestination, clampUnitToField, setLeapArcPosition } from '../../game/field'
import { dealDamageToUnit } from '../../game/unitDamage'
import { spawnShockwave } from './combatEffects'
import { getCoralGolemConfig } from '../cataclysm_coral_golem/config'
import { getCoralssusConfig } from '../cataclysm_coralssus/config'

export const CORAL_LEAP_TAG = 'coral_leap_special'

export interface CoralLeapConfig {
  leapMaxRange: number
  leapRadius: number
  leapDamage: number
  leapDuration: number
  attackInterval: number
}

export function getCoralLeapConfig(unit: BattleUnit | string): CoralLeapConfig {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  if (id === 'cataclysm_coralssus') {
    const c = getCoralssusConfig()
    return {
      leapMaxRange: c.leapMaxRange,
      leapRadius: c.leapRadius,
      leapDamage: c.leapDamage,
      leapDuration: c.leapDuration,
      attackInterval: c.attackInterval,
    }
  }
  const c = getCoralGolemConfig()
  return {
    leapMaxRange: c.leapMaxRange,
    leapRadius: c.leapRadius,
    leapDamage: c.leapDamage,
    leapDuration: c.leapDuration,
    attackInterval: c.attackInterval,
  }
}

export function isCoralLeapUnit(unit: BattleUnit | string): boolean {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === 'cataclysm_coral_golem' || id === 'cataclysm_coralssus'
}

export function coralLeapEngageRange(unit: BattleUnit) {
  return getCoralLeapConfig(unit).leapMaxRange
}

export function initCoralLeapState(unit: BattleUnit) {
  unit.leapTimeLeft = 0
}

function applyLeapLanding(
  unit: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
  cfg: CoralLeapConfig,
) {
  for (const u of units) {
    if (u.state === 'dead' || u.team === unit.team) continue
    if (Math.hypot(u.x - unit.x, u.y - unit.y) <= cfg.leapRadius + u.radius * 0.45) {
      u.hp -= dealDamageToUnit(u, cfg.leapDamage, 'melee')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, cfg.leapRadius, 0.42)
}

export function startCoralLeap(unit: BattleUnit, target: BattleUnit) {
  const cfg = getCoralLeapConfig(unit)
  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  unit.leapFromX = unit.x
  unit.leapFromY = unit.y
  unit.leapToX = target.x
  unit.leapToY = target.y
  clampLeapDestination(unit, tags)
  unit.leapTimeLeft = cfg.leapDuration
  unit.state = 'attack'
  unit.attackAnimTimer = cfg.leapDuration
  unit.facing = target.x >= unit.x ? 1 : -1
}

export function tickCoralLeap(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
): boolean {
  const cfg = getCoralLeapConfig(unit)
  if (unit.leapTimeLeft <= 0) return false

  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  const total = cfg.leapDuration
  const elapsed = total - unit.leapTimeLeft
  unit.leapTimeLeft -= dt
  const t = Math.min(1, (elapsed + dt) / total)
  setLeapArcPosition(unit, tags, t, 42)
  unit.state = 'attack'

  if (unit.leapTimeLeft <= 0) {
    unit.x = unit.leapToX
    unit.y = unit.leapToY
    clampUnitToField(unit, tags)
    applyLeapLanding(unit, units, shockwaves, cfg)
    unit.leapTimeLeft = 0
    return false
  }
  return true
}

export function canCoralLeapAttack(unit: BattleUnit, target: BattleUnit, dist: number): boolean {
  const cfg = getCoralLeapConfig(unit)
  return dist <= cfg.leapMaxRange + target.radius * 0.35
}
