import type { BattleUnit, ConeStrikeEffect, ShockwaveEffect } from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { clampUnitToField } from '../../game/field'
import { dealDamageToUnit } from '../../game/unitDamage'
import { getKobolediatorConfig } from './config'
import { isUnitInStompSector } from '../cataclysm_ancient_remnant/abilities'
import { eid, spawnShockwave } from '../_shared/combatEffects'

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
  waveWidth: number,
  duration: number,
) {
  cones.push({
    id: eid(),
    team: unit.team,
    x: unit.x,
    y: unit.y,
    aimAngle,
    maxLength: length,
    angleDeg,
    waveWidth,
    startReach: waveWidth * 0.5,
    reach: waveWidth * 0.5,
    remaining: duration,
    duration,
  })
}

export function pickKobolediatorSkill(
  unit: BattleUnit,
  target: BattleUnit,
  dist: number,
): KoboSkillId | null {
  const c = cfg()
  if (dist > c.engageRange + target.radius * 0.35) return null
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
  unit.koboChargeToX = target.x
  unit.koboChargeToY = target.y
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
    spawnConeVisual(coneStrikes, unit, aim, c.tripleConeLength, c.tripleConeAngleDeg, 72, 0.4)
  } else if (strikeIndex === 1) {
    const aim = base + offset
    applyConeDamage(unit, units, aim, c.tripleSlashDamage, c.tripleConeLength, c.tripleConeAngleDeg)
    spawnConeVisual(coneStrikes, unit, aim, c.tripleConeLength, c.tripleConeAngleDeg, 72, 0.4)
  } else {
    applyCircleDamage(unit, units, unit.x, unit.y, c.tripleFinaleRadius, c.tripleFinaleDamage)
    spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.tripleFinaleRadius * 0.9, 0.38)
  }
}

function executeStomp(
  unit: BattleUnit,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
  shockwaves: ShockwaveEffect[],
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
    c.stompWaveWidth,
    c.stompCastDuration * 0.55,
  )
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.stompConeLength * 0.4, 0.35)
  const sw = shockwaves[shockwaves.length - 1]
  if (sw) sw.kind = 'sand'
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
    executeStomp(unit, units, coneStrikes, shockwaves)
  }
}

export function tickKoboCast(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
  shockwaves: ShockwaveEffect[],
): boolean {
  if (unit.koboCastTimeLeft <= 0) return false

  const c = cfg()
  const isTriple = unit.koboPendingSkill === 'triple'
  const total = isTriple ? c.tripleCastDuration : c.stompCastDuration
  const elapsed = total - unit.koboCastTimeLeft

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
