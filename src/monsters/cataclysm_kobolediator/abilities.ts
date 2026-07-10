import type { BattleUnit, ConeStrikeEffect, ShockwaveEffect } from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { clampUnitToField, clampDestinationPoint } from '../../game/field'
import { dealDamageToUnit } from '../../game/unitDamage'
import { getKobolediatorConfig } from './config'
import { isWithinCastRange, isSkillAllowedForTarget } from '../../game/unitCombat'
import { isUnitInStompSector } from '../cataclysm_ancient_remnant/abilities'
import { spawnInstantConeVisual, spawnShockwave } from '../_shared/combatEffects'

export const KOBO_ID = 'cataclysm_kobolediator'

export type KoboSkillId = 'charge' | 'triple' | 'stomp'

function cfg() {
  return getKobolediatorConfig()
}

export function isKobolediator(unit: BattleUnit | string) {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === KOBO_ID
}

export function initKobolediatorState(unit: BattleUnit) {
  unit.koboCastTimeLeft = 0
  unit.koboPendingSkill = null
  unit.koboCycleSkill = 'triple'
  unit.koboChargeTimeLeft = 0
  unit.koboChargeFromX = 0
  unit.koboChargeFromY = 0
  unit.koboChargeToX = 0
  unit.koboChargeToY = 0
  unit.koboTripleStrikesDone = 0
  unit.koboCastAimAngle = 0
}

export function kobolediatorEngageRange() {
  return cfg().engageRange
}

function coneHalfRad(angleDeg: number) {
  return (angleDeg * Math.PI) / 180 / 2
}

function applyConeDamage(
  attacker: BattleUnit,
  units: BattleUnit[],
  aimAngle: number,
  damage: number,
  length: number,
  angleDeg: number,
) {
  const halfRad = coneHalfRad(angleDeg)
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team || u.moveType === 'fly') continue
    if (isUnitInStompSector(attacker.x, attacker.y, aimAngle, halfRad, length, u)) {
      u.hp -= dealDamageToUnit(u, damage, 'melee')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
}

function applyCircleDamage(
  attacker: BattleUnit,
  units: BattleUnit[],
  cx: number,
  cy: number,
  radius: number,
  damage: number,
) {
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team || u.moveType === 'fly') continue
    if (Math.hypot(u.x - cx, u.y - cy) <= radius + u.radius * 0.45) {
      u.hp -= dealDamageToUnit(u, damage, 'melee')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
}

function spawnConeVisual(
  cones: ConeStrikeEffect[],
  unit: BattleUnit,
  aimAngle: number,
  length: number,
  angleDeg: number,
) {
  spawnInstantConeVisual(cones, unit.team, unit.x, unit.y, aimAngle, length, angleDeg)
}

const SEPARATION_FORCE = 120

function separateAllies(unit: BattleUnit, allies: BattleUnit[], dt: number) {
  let sx = 0
  let sy = 0
  for (const ally of allies) {
    if (ally.id === unit.id || ally.state === 'dead') continue
    const d = Math.hypot(unit.x - ally.x, unit.y - ally.y)
    const minDist = unit.radius + ally.radius
    if (d > 0 && d < minDist) {
      const push = (minDist - d) / minDist
      sx += ((unit.x - ally.x) / d) * push
      sy += ((unit.y - ally.y) / d) * push
    }
  }
  unit.x += sx * SEPARATION_FORCE * dt
  unit.y += sy * SEPARATION_FORCE * dt
}

/** 三连击期间追击目标并实时更新朝向与挥砍角度 */
function tickKoboTripleTracking(
  unit: BattleUnit,
  target: BattleUnit,
  allies: BattleUnit[],
  dt: number,
) {
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.koboCastAimAngle = Math.atan2(target.y - unit.y, target.x - unit.x)

  const dx = target.x - unit.x
  const dy = target.y - unit.y
  const len = Math.hypot(dx, dy) || 1
  unit.x += (dx / len) * unit.moveSpeed * dt
  unit.y += (dy / len) * unit.moveSpeed * dt
  separateAllies(unit, allies, dt)
  clampUnitToField(unit, MONSTER_MAP[unit.monsterId]?.tags ?? [])
  unit.state = 'attack'
}

export function koboSkillCastRange(skill: KoboSkillId): number {
  const c = cfg()
  switch (skill) {
    case 'charge':
      return c.engageRange
    case 'triple':
      return c.tripleConeLength
    case 'stomp':
      return c.stompConeLength
  }
}

export function isKoboSkillAllowed(_skill: KoboSkillId, target: BattleUnit): boolean {
  return isSkillAllowedForTarget(true, target)
}

export function isKoboSkillInRange(
  skill: KoboSkillId,
  target: BattleUnit,
  dist: number,
): boolean {
  if (!isKoboSkillAllowed(skill, target)) return false
  const c = cfg()
  if (skill === 'charge') {
    return (
      dist >= c.chargeMinDist
      && isWithinCastRange(dist, c.engageRange, target)
    )
  }
  return isWithinCastRange(dist, koboSkillCastRange(skill), target)
}

export function pickKobolediatorSkill(unit: BattleUnit, dist: number, target: BattleUnit): KoboSkillId | null {
  const c = cfg()
  if (target.moveType === 'fly') return null
  if (dist >= c.chargeMinDist) return 'charge'
  return unit.koboCycleSkill
}

export function startKoboCharge(
  unit: BattleUnit,
  target: BattleUnit,
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  unit.koboPendingSkill = 'charge'
  unit.koboChargeFromX = unit.x
  unit.koboChargeFromY = unit.y
  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  const dest = clampDestinationPoint(target.x, target.y, unit.radius, tags)
  unit.koboChargeToX = dest.x
  unit.koboChargeToY = dest.y
  unit.koboChargeTimeLeft = c.chargeDuration
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.attackAnimTimer = c.chargeDuration
  unit.state = 'attack'
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, 28, 0.25)
}

export function tickKoboCharge(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
): boolean {
  if (unit.koboChargeTimeLeft <= 0) return false

  const c = cfg()
  const total = c.chargeDuration
  const elapsed = total - unit.koboChargeTimeLeft
  unit.koboChargeTimeLeft -= dt
  const t = Math.min(1, (elapsed + dt) / total)
  unit.x = unit.koboChargeFromX + (unit.koboChargeToX - unit.koboChargeFromX) * t
  unit.y = unit.koboChargeFromY + (unit.koboChargeToY - unit.koboChargeFromY) * t
  clampUnitToField(unit, MONSTER_MAP[unit.monsterId]?.tags ?? [])

  if (unit.koboChargeTimeLeft > 0) return true

  applyCircleDamage(unit, units, unit.x, unit.y, c.chargeRadius, c.chargeDamage)
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.chargeRadius * 0.85, 0.4)
  unit.koboPendingSkill = null
  unit.attackCooldown = c.chargeDuration
  return false
}

function executeTripleStrike(
  unit: BattleUnit,
  units: BattleUnit[],
  strikeIndex: 0 | 1 | 2,
  coneStrikes: ConeStrikeEffect[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  const base = unit.koboCastAimAngle
  const offset = (c.tripleConeOffsetDeg * Math.PI) / 180

  if (strikeIndex === 0) {
    const aim = base - offset
    applyConeDamage(unit, units, aim, c.tripleSlashDamage, c.tripleConeLength, c.tripleConeAngleDeg)
    spawnConeVisual(coneStrikes, unit, aim, c.tripleConeLength, c.tripleConeAngleDeg)
  } else if (strikeIndex === 1) {
    const aim = base + offset
    applyConeDamage(unit, units, aim, c.tripleSlashDamage, c.tripleConeLength, c.tripleConeAngleDeg)
    spawnConeVisual(coneStrikes, unit, aim, c.tripleConeLength, c.tripleConeAngleDeg)
  } else {
    applyCircleDamage(unit, units, unit.x, unit.y, c.tripleFinaleRadius, c.tripleFinaleDamage)
    spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.tripleFinaleRadius * 0.9, 0.38)
  }
}

function executeStomp(
  unit: BattleUnit,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
) {
  const c = cfg()
  applyConeDamage(
    unit,
    units,
    unit.koboCastAimAngle,
    c.stompDamage,
    c.stompConeLength,
    c.stompConeAngleDeg,
  )
  spawnConeVisual(
    coneStrikes,
    unit,
    unit.koboCastAimAngle,
    c.stompConeLength,
    c.stompConeAngleDeg,
  )
}

export function startKoboCast(
  unit: BattleUnit,
  skill: 'triple' | 'stomp',
  target: BattleUnit,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  const duration = skill === 'triple' ? c.tripleCastDuration : c.stompCastDuration
  unit.koboPendingSkill = skill
  unit.koboCastTimeLeft = duration
  unit.koboTripleStrikesDone = 0
  unit.koboCastAimAngle = Math.atan2(target.y - unit.y, target.x - unit.x)
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.attackAnimTimer = duration
  unit.state = 'attack'

  if (skill === 'triple') {
    executeTripleStrike(unit, units, 0, coneStrikes, shockwaves)
    unit.koboTripleStrikesDone = 1
  } else {
    executeStomp(unit, units, coneStrikes)
  }
}

export function tickKoboCast(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
  shockwaves: ShockwaveEffect[],
  target: BattleUnit | null = null,
  allies: BattleUnit[] = [],
): boolean {
  if (unit.koboCastTimeLeft <= 0) return false

  const c = cfg()
  const isTriple = unit.koboPendingSkill === 'triple'
  const total = isTriple ? c.tripleCastDuration : c.stompCastDuration
  const elapsed = total - unit.koboCastTimeLeft

  if (isTriple && target && target.state !== 'dead') {
    tickKoboTripleTracking(unit, target, allies, dt)
  }

  if (isTriple) {
    const secondAt = total * 0.5
    if (unit.koboTripleStrikesDone === 1 && elapsed >= secondAt && elapsed - dt < secondAt) {
      executeTripleStrike(unit, units, 1, coneStrikes, shockwaves)
      unit.koboTripleStrikesDone = 2
    }
  }

  unit.koboCastTimeLeft -= dt
  if (unit.koboCastTimeLeft > 0) return true

  if (isTriple && unit.koboTripleStrikesDone === 2) {
    executeTripleStrike(unit, units, 2, coneStrikes, shockwaves)
    unit.koboTripleStrikesDone = 3
    unit.koboCycleSkill = 'stomp'
  } else if (!isTriple) {
    unit.koboCycleSkill = 'triple'
  }

  unit.koboPendingSkill = null
  unit.attackCooldown = total
  return false
}

export function isKobolediatorBusy(unit: BattleUnit): boolean {
  return unit.koboChargeTimeLeft > 0 || unit.koboCastTimeLeft > 0
}
