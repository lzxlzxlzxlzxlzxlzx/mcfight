import type { BattleUnit, ConeStrikeEffect, Projectile, ShockwaveEffect } from '../../game/types'
import { isWithinCastRange } from '../../game/unitCombat'
import { dealDamageToUnit } from '../../game/unitDamage'
import { isUnitInStompSector } from '../cataclysm_ancient_remnant/abilities'
import { eid, spawnInstantConeVisual, spawnShockwave } from '../_shared/combatEffects'
import { getIgnitedRevenantConfig, type RevenantSkill } from './config'

export const REVENANT_ID = 'cataclysm_ignited_revenant'

function cfg() {
  return getIgnitedRevenantConfig()
}

export function initRevenantState(unit: BattleUnit) {
  unit.revenantCastTimeLeft = 0
  unit.revenantPendingSkill = null
  unit.revenantTicksDone = 0
  unit.revenantAimAngle = 0
  unit.revenantAttackCooldown = 0
}

/** 除烈焰之骨施法期间外均处于防御状态 */
export function isRevenantDefending(unit: BattleUnit): boolean {
  if (unit.revenantCastTimeLeft > 0 && unit.revenantPendingSkill === 'bones') return false
  return true
}

export function isRevenantBusy(unit: BattleUnit): boolean {
  return unit.revenantCastTimeLeft > 0
}

export function revenantEngageRange() {
  const c = cfg()
  return Math.max(c.spinRadius, c.breathRange, c.bonesRange)
}

function breathHalfAngleRad() {
  return (cfg().breathConeAngleDeg * Math.PI) / 180 / 2
}

export function pickRevenantSkill(
  unit: BattleUnit,
  target: BattleUnit,
  dist: number,
): RevenantSkill | null {
  const skills: RevenantSkill[] = ['spin', 'breath', 'bones']
  const available = skills.filter((s) => isRevenantSkillInRange(s, unit, target, dist))
  if (!available.length) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function isRevenantSkillInRange(
  skill: RevenantSkill,
  _unit: BattleUnit,
  target: BattleUnit,
  dist: number,
): boolean {
  const c = cfg()
  switch (skill) {
    case 'spin':
      return isWithinCastRange(dist, c.spinRadius, target) && target.moveType === 'ground'
    case 'breath':
      return isWithinCastRange(dist, c.breathRange, target)
    case 'bones':
      return isWithinCastRange(dist, c.bonesRange, target)
  }
}

function applySpinTick(unit: BattleUnit, units: BattleUnit[], shockwaves: ShockwaveEffect[]) {
  const c = cfg()
  for (const u of units) {
    if (u.state === 'dead' || u.team === unit.team || u.moveType === 'fly') continue
    if (Math.hypot(u.x - unit.x, u.y - unit.y) <= c.spinRadius + u.radius * 0.5) {
      u.hp -= dealDamageToUnit(u, c.spinDamage, 'melee')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.spinRadius * 0.85, 0.28)
}

function applyBreathTick(unit: BattleUnit, units: BattleUnit[]) {
  const c = cfg()
  const halfRad = breathHalfAngleRad()
  for (const u of units) {
    if (u.state === 'dead' || u.team === unit.team) continue
    if (isUnitInStompSector(unit.x, unit.y, unit.revenantAimAngle, halfRad, c.breathRange, u)) {
      u.hp -= dealDamageToUnit(u, c.breathDamage, 'ranged')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
}

export function spawnRevenantBone(
  unit: BattleUnit,
  target: BattleUnit,
  projectiles: Projectile[],
) {
  const c = cfg()
  const dx = target.x - unit.x
  const dy = target.y - unit.y
  const len = Math.hypot(dx, dy) || 1
  projectiles.push({
    id: eid(),
    team: unit.team,
    x: unit.x,
    y: unit.y,
    targetId: target.id,
    speed: c.bonesProjectileSpeed,
    rawDamage: c.bonesDamage,
    sourceId: unit.id,
    sourceMonsterId: unit.monsterId,
    kind: 'revenant_bone',
    dirX: dx / len,
    dirY: dy / len,
    maxTravel: c.bonesRange * 1.1,
    traveled: 0,
  })
}

export function startRevenantCast(
  unit: BattleUnit,
  skill: RevenantSkill,
  target: BattleUnit,
  coneStrikes: ConeStrikeEffect[],
) {
  const c = cfg()
  unit.revenantPendingSkill = skill
  unit.revenantTicksDone = 0
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.revenantAimAngle = Math.atan2(target.y - unit.y, target.x - unit.x)
  unit.state = 'attack'

  if (skill === 'spin') {
    unit.revenantCastTimeLeft = c.spinDuration
    unit.attackAnimTimer = c.spinDuration
  } else if (skill === 'breath') {
    unit.revenantCastTimeLeft = c.breathDuration
    unit.attackAnimTimer = c.breathDuration
    spawnInstantConeVisual(
      coneStrikes,
      unit.team,
      unit.x,
      unit.y,
      unit.revenantAimAngle,
      c.breathRange,
      c.breathConeAngleDeg,
      c.breathDuration,
    )
    const cone = coneStrikes[coneStrikes.length - 1]
    if (cone) cone.kind = 'wave'
  } else {
    unit.revenantCastTimeLeft = c.bonesDuration
    unit.attackAnimTimer = c.bonesDuration
  }
}

export function tickRevenantCast(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  _coneStrikes: ConeStrikeEffect[],
  projectiles: Projectile[],
  shockwaves: ShockwaveEffect[],
): boolean {
  if (unit.revenantCastTimeLeft <= 0) return false

  const c = cfg()
  const skill = unit.revenantPendingSkill
  if (!skill) return false

  unit.state = 'attack'
  const duration =
    skill === 'spin' ? c.spinDuration : skill === 'breath' ? c.breathDuration : c.bonesDuration
  unit.revenantCastTimeLeft -= dt
  const elapsed = duration - unit.revenantCastTimeLeft

  if (skill === 'spin') {
    const interval = c.spinDuration / c.spinHits
    while (unit.revenantTicksDone < c.spinHits && elapsed >= interval * (unit.revenantTicksDone + 1)) {
      applySpinTick(unit, units, shockwaves)
      unit.revenantTicksDone++
    }
  } else if (skill === 'breath') {
    const interval = c.breathDuration / c.breathHits
    while (unit.revenantTicksDone < c.breathHits && elapsed >= interval * (unit.revenantTicksDone + 1)) {
      applyBreathTick(unit, units)
      unit.revenantTicksDone++
    }
  } else if (skill === 'bones') {
    const target = units.find((u) => u.id === unit.targetId && u.state !== 'dead')
    const interval = c.bonesDuration / c.bonesCount
    while (unit.revenantTicksDone < c.bonesCount && elapsed >= interval * (unit.revenantTicksDone + 1)) {
      if (target) spawnRevenantBone(unit, target, projectiles)
      unit.revenantTicksDone++
    }
    if (target) unit.facing = target.x >= unit.x ? 1 : -1
  }

  if (unit.revenantCastTimeLeft > 0) return true

  unit.revenantPendingSkill = null
  unit.revenantTicksDone = 0
  unit.revenantAttackCooldown = c.postAttackCooldown
  unit.attackAnimTimer = 0.3
  return false
}
