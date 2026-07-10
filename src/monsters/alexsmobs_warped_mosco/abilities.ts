import type { BattleUnit, ShockwaveEffect } from '../../game/types'
import { dealDamageToUnit } from '../../game/unitDamage'
import { isWithinCastRange, isSkillAllowedForTarget } from '../../game/unitCombat'
import { spawnShockwave } from '../_shared/combatEffects'
import { getWarpedMoscoConfig } from './config'

export const MOSCO_ID = 'alexsmobs_warped_mosco'

export type MoscoSkillId = 'punch' | 'slap' | 'drain'

const MOSCO_SKILLS: MoscoSkillId[] = ['punch', 'slap', 'drain']

function cfg() {
  return getWarpedMoscoConfig()
}

function rollSlapDamage() {
  const c = cfg()
  return c.slapDamageMin + Math.random() * (c.slapDamageMax - c.slapDamageMin)
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

export function initWarpedMoscoState(unit: BattleUnit) {
  unit.moscoPhase = 'ground'
  unit.moscoCastTimeLeft = 0
}

export function moscoEngageRange(unit: BattleUnit) {
  const c = cfg()
  return unit.moscoPhase === 'frenzy' ? c.frenzyAttackRange : c.meleeRange
}

export function isMoscoInFrenzy(unit: BattleUnit) {
  return unit.moscoPhase === 'frenzy'
}

export function tryTransformWarpedMosco(unit: BattleUnit) {
  if (unit.moscoPhase !== 'ground') return false
  const c = cfg()
  if (unit.hp > c.transformHpThreshold) return false

  unit.moscoPhase = 'frenzy'
  unit.moveType = 'fly'
  unit.attackType = 'ranged'
  unit.moveSpeed = c.frenzyMoveSpeed
  unit.baseMoveSpeed = c.frenzyMoveSpeed
  unit.attack = c.frenzyAttack
  unit.attackRange = c.frenzyAttackRange
  unit.attackInterval = c.frenzyAttackInterval
  unit.baseAttackInterval = c.frenzyAttackInterval
  unit.moscoCastTimeLeft = 0
  unit.attackCooldown = 0
  unit.state = 'chase'
  return true
}

export function pickMoscoSkill(target: BattleUnit): MoscoSkillId | null {
  const pool = MOSCO_SKILLS.filter((skill) => isMoscoSkillAllowed(skill, target))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export function isMoscoSkillAllowed(_skill: MoscoSkillId, target: BattleUnit): boolean {
  return isSkillAllowedForTarget(true, target)
}

export function isMoscoSkillInRange(
  skill: MoscoSkillId,
  unit: BattleUnit,
  target: BattleUnit,
  dist: number,
  units: BattleUnit[],
): boolean {
  if (!isMoscoSkillAllowed(skill, target)) return false
  const c = cfg()
  switch (skill) {
    case 'punch':
    case 'drain':
      return isWithinCastRange(dist, c.meleeRange, target)
    case 'slap':
      return hasEnemyInRadius(unit, units, c.slapRadius)
  }
}

export function executeMoscoGroundSkill(
  unit: BattleUnit,
  skill: MoscoSkillId,
  target: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  unit.state = 'attack'
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.attackCooldown = c.skillInterval

  switch (skill) {
    case 'punch': {
      target.hp -= dealDamageToUnit(target, c.punchDamage, 'melee')
      if (target.hp <= 0) target.state = 'dead'
      unit.attackAnimTimer = 0.35
      break
    }
    case 'slap': {
      const damage = rollSlapDamage()
      for (const u of units) {
        if (u.state === 'dead' || u.team === unit.team) continue
        if (Math.hypot(u.x - unit.x, u.y - unit.y) <= c.slapRadius + u.radius * 0.5) {
          u.hp -= dealDamageToUnit(u, damage, 'melee')
          if (u.hp <= 0) u.state = 'dead'
        }
      }
      spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.slapRadius * 0.9, 0.4)
      unit.attackAnimTimer = 0.45
      break
    }
    case 'drain': {
      target.hp -= dealDamageToUnit(target, c.drainDamage, 'melee')
      if (target.hp <= 0) target.state = 'dead'
      unit.hp = Math.min(unit.maxHp, unit.hp + c.drainHeal)
      unit.moscoCastTimeLeft = c.drainLockDuration
      unit.attackAnimTimer = c.drainLockDuration
      break
    }
  }
}

export function tickMoscoCast(unit: BattleUnit, dt: number): boolean {
  if (unit.moscoCastTimeLeft <= 0) return false
  unit.moscoCastTimeLeft -= dt
  unit.state = 'attack'
  return unit.moscoCastTimeLeft > 0
}

export function isMoscoFrenzyAntiAir(unit: BattleUnit): boolean {
  return unit.moscoPhase === 'frenzy'
}

export function isMoscoCasting(unit: BattleUnit): boolean {
  return unit.moscoPhase === 'ground' && unit.moscoCastTimeLeft > 0
}
