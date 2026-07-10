import type { BattleUnit, ShockwaveEffect, VoidRuneEffect } from '../../game/types'
import { dealDamageToUnit } from '../../game/unitDamage'
import { isWithinCastRange, isSkillAllowedForTarget } from '../../game/unitCombat'
import { distPointToBeam } from '../alexscaves_tremorzilla/abilities'
import { eid, spawnShockwave } from '../_shared/combatEffects'
import { getEnderGolemConfig } from './config'

export const ENDER_GOLEM_ID = 'cataclysm_ender_golem'

export type EnderSkillId = 'punch' | 'slam' | 'void_rune'

const ENDER_SKILLS: EnderSkillId[] = ['punch', 'slam', 'void_rune']

function cfg() {
  return getEnderGolemConfig()
}

function rollDamage(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function hasEnemyInRadius(attacker: BattleUnit, units: BattleUnit[], radius: number) {
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team) continue
    if (Math.hypot(u.x - attacker.x, u.y - attacker.y) <= radius + u.radius * 0.35) {
      return true
    }
  }
  return false
}

export function enderGolemEngageRange() {
  const c = cfg()
  return Math.max(c.punchRange, c.voidRuneCastRange)
}

export function enderSkillCastRange(skill: EnderSkillId): number {
  const c = cfg()
  switch (skill) {
    case 'punch':
      return c.punchRange
    case 'slam':
      return c.slamRadius
    case 'void_rune':
      return c.voidRuneCastRange
  }
}

export function isEnderSkillAllowed(skill: EnderSkillId, target: BattleUnit): boolean {
  if (skill === 'void_rune') return true
  return isSkillAllowedForTarget(true, target)
}

export function isEnderSkillInRange(
  skill: EnderSkillId,
  unit: BattleUnit,
  target: BattleUnit,
  dist: number,
  units: BattleUnit[],
): boolean {
  if (!isEnderSkillAllowed(skill, target)) return false
  const c = cfg()
  switch (skill) {
    case 'punch':
      return isWithinCastRange(dist, c.punchRange, target)
    case 'slam':
      return hasEnemyInRadius(unit, units, c.slamRadius)
    case 'void_rune':
      return isWithinCastRange(dist, c.voidRuneCastRange, target)
  }
}

export function pickEnderGolemSkill(target: BattleUnit): EnderSkillId | null {
  const pool = ENDER_SKILLS.filter((skill) => isEnderSkillAllowed(skill, target))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

function spawnVoidRuneVisual(
  voidRunes: VoidRuneEffect[],
  unit: BattleUnit,
  dirX: number,
  dirY: number,
) {
  const c = cfg()
  voidRunes.push({
    id: eid(),
    team: unit.team,
    originX: unit.x,
    originY: unit.y,
    dirX,
    dirY,
    barLength: c.voidRuneBarLength,
    barHalfWidth: c.voidRuneBarHalfWidth,
    circleRadius: c.voidRuneCircleRadius,
    remaining: 0.7,
    duration: 0.7,
  })
}

function applyVoidRuneDamage(
  unit: BattleUnit,
  aimAngle: number,
  units: BattleUnit[],
  damage: number,
) {
  const c = cfg()
  const dirX = Math.cos(aimAngle)
  const dirY = Math.sin(aimAngle)

  for (const u of units) {
    if (u.state === 'dead' || u.team === unit.team) continue
    const inBar = distPointToBeam(
      u.x,
      u.y,
      unit.x,
      unit.y,
      dirX,
      dirY,
      c.voidRuneBarLength,
    ) <= c.voidRuneBarHalfWidth + u.radius * 0.35
    const inCircle = Math.hypot(u.x - unit.x, u.y - unit.y) <= c.voidRuneCircleRadius + u.radius * 0.35
    if (!inBar && !inCircle) continue
    u.hp -= dealDamageToUnit(u, damage, 'ranged')
    if (u.hp <= 0) u.state = 'dead'
  }
}

export function executeEnderGolemSkill(
  unit: BattleUnit,
  skill: EnderSkillId,
  target: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
  voidRunes: VoidRuneEffect[],
) {
  const c = cfg()
  unit.state = 'attack'
  unit.facing = target.x >= unit.x ? 1 : -1

  switch (skill) {
    case 'punch': {
      const damage = rollDamage(c.punchDamageMin, c.punchDamageMax)
      target.hp -= dealDamageToUnit(target, damage, 'melee')
      if (target.hp <= 0) target.state = 'dead'
      unit.attackAnimTimer = 0.35
      break
    }
    case 'slam': {
      const damage = rollDamage(c.slamDamageMin, c.slamDamageMax)
      for (const u of units) {
        if (u.state === 'dead' || u.team === unit.team) continue
        if (Math.hypot(u.x - unit.x, u.y - unit.y) <= c.slamRadius + u.radius * 0.5) {
          u.hp -= dealDamageToUnit(u, damage, 'melee')
          if (u.hp <= 0) u.state = 'dead'
        }
      }
      spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.slamRadius * 0.9, 0.42)
      unit.attackAnimTimer = 0.45
      break
    }
    case 'void_rune': {
      const damage = rollDamage(c.voidRuneDamageMin, c.voidRuneDamageMax)
      const aimAngle = Math.atan2(target.y - unit.y, target.x - unit.x)
      applyVoidRuneDamage(unit, aimAngle, units, damage)
      spawnVoidRuneVisual(voidRunes, unit, Math.cos(aimAngle), Math.sin(aimAngle))
      spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.voidRuneCircleRadius * 0.85, 0.35)
      unit.attackAnimTimer = 0.5
      break
    }
  }

  unit.attackCooldown = c.attackInterval
  unit.enderCastTimeLeft = c.skillLockDuration
  unit.attackAnimTimer = Math.max(unit.attackAnimTimer, c.skillLockDuration)
}

export function tickEnderGolemCast(unit: BattleUnit, dt: number): boolean {
  if (unit.enderCastTimeLeft <= 0) return false
  unit.enderCastTimeLeft -= dt
  unit.state = 'attack'
  return unit.enderCastTimeLeft > 0
}

export function isEnderGolemBusy(unit: BattleUnit): boolean {
  return unit.enderCastTimeLeft > 0
}

export function tickVoidRuneEffects(voidRunes: VoidRuneEffect[], dt: number) {
  for (let i = voidRunes.length - 1; i >= 0; i--) {
    voidRunes[i].remaining -= dt
    if (voidRunes[i].remaining <= 0) voidRunes.splice(i, 1)
  }
}
