import type { BattleUnit, ShockwaveEffect } from '../../game/types'
import { isWithinCastRange } from '../../game/unitCombat'
import { dealDamageToUnit } from '../../game/unitDamage'
import { spawnShockwave } from '../_shared/combatEffects'
import { getAmethystCrabConfig } from './config'

export const AMETHYST_CRAB_ID = 'cataclysm_amethyst_crab'

export type CrabSkill = 'emerge' | 'sweep'

function cfg() {
  return getAmethystCrabConfig()
}

export function initAmethystCrabState(unit: BattleUnit) {
  unit.crabBurrowTimeLeft = 0
  unit.crabCastTimeLeft = 0
  unit.crabPendingSkill = null
}

export function isAmethystCrabBurrowed(unit: BattleUnit): boolean {
  return unit.crabBurrowTimeLeft > 0
}

export function isAmethystCrabBusy(unit: BattleUnit): boolean {
  return unit.crabBurrowTimeLeft > 0 || unit.crabCastTimeLeft > 0
}

export function amethystCrabEngageRange() {
  return cfg().emergeRange
}

export function hasEnemyInEmergeRange(unit: BattleUnit, units: BattleUnit[]): boolean {
  const c = cfg()
  for (const enemy of units) {
    if (enemy.state === 'dead' || enemy.team === unit.team) continue
    const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y)
    if (isWithinCastRange(dist, c.emergeRange, enemy)) return true
  }
  return false
}

function faceNearestEnemy(unit: BattleUnit, units: BattleUnit[]) {
  let nearest: BattleUnit | null = null
  let best = Infinity
  for (const enemy of units) {
    if (enemy.state === 'dead' || enemy.team === unit.team) continue
    const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y)
    if (dist < best) {
      best = dist
      nearest = enemy
    }
  }
  if (nearest) unit.facing = nearest.x >= unit.x ? 1 : -1
}

function damageInRadius(
  attacker: BattleUnit,
  centerX: number,
  centerY: number,
  radius: number,
  units: BattleUnit[],
  damage: number,
  groundOnly: boolean,
) {
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team) continue
    if (groundOnly && u.moveType === 'fly') continue
    if (Math.hypot(u.x - centerX, u.y - centerY) <= radius + u.radius * 0.5) {
      u.hp -= dealDamageToUnit(u, damage, 'melee')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
}

export function startAmethystCrabBurrow(unit: BattleUnit) {
  const c = cfg()
  unit.crabBurrowTimeLeft = c.burrowDuration
  unit.crabCastTimeLeft = 0
  unit.crabPendingSkill = null
  unit.state = 'attack'
  unit.attackAnimTimer = c.burrowDuration
}

function executeEmerge(unit: BattleUnit, units: BattleUnit[], shockwaves: ShockwaveEffect[]) {
  const c = cfg()
  faceNearestEnemy(unit, units)
  damageInRadius(unit, unit.x, unit.y, c.emergeRadius, units, c.damage, false)
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.emergeRadius * 0.9, 0.5)
  unit.attackAnimTimer = 0.35
}

function executeSweep(unit: BattleUnit, units: BattleUnit[], shockwaves: ShockwaveEffect[]) {
  const c = cfg()
  faceNearestEnemy(unit, units)
  damageInRadius(unit, unit.x, unit.y, c.sweepRadius, units, c.damage, true)
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.sweepRadius * 0.85, 0.38)
  unit.attackAnimTimer = 0.35
}

function beginSweepCast(unit: BattleUnit) {
  const c = cfg()
  unit.crabPendingSkill = 'sweep'
  unit.crabCastTimeLeft = c.sweepCastDuration
  unit.attackAnimTimer = c.sweepCastDuration
}

export function tickAmethystCrab(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
): boolean {
  const c = cfg()

  if (unit.crabBurrowTimeLeft > 0) {
    unit.state = 'attack'
    unit.crabBurrowTimeLeft -= dt
    if (unit.crabBurrowTimeLeft > 0) return true

    unit.crabBurrowTimeLeft = 0
    unit.crabPendingSkill = 'emerge'
    unit.crabCastTimeLeft = c.emergeCastDuration
    unit.attackAnimTimer = c.emergeCastDuration
    faceNearestEnemy(unit, units)
    return true
  }

  if (unit.crabCastTimeLeft > 0 && unit.crabPendingSkill) {
    unit.state = 'attack'
    faceNearestEnemy(unit, units)
    unit.crabCastTimeLeft -= dt
    if (unit.crabCastTimeLeft > 0) return true

    const skill = unit.crabPendingSkill
    unit.crabPendingSkill = null
    unit.crabCastTimeLeft = 0

    if (skill === 'emerge') {
      executeEmerge(unit, units, shockwaves)
      beginSweepCast(unit)
      return true
    }

    if (skill === 'sweep') {
      executeSweep(unit, units, shockwaves)
      if (hasEnemyInEmergeRange(unit, units)) {
        startAmethystCrabBurrow(unit)
      }
      return true
    }
  }

  return false
}
