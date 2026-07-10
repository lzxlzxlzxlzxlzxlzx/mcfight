import type { BattleUnit, ShockwaveEffect } from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { applyStatusEffect } from '../../game/statusEffects'
import { spawnShockwave } from '../_shared/combatEffects'
import { getTremorsaurusConfig } from './config'

export const TREMORSAURUS_ID = 'alexscaves_tremorsaurus'

function cfg() {
  return getTremorsaurusConfig()
}

export function rollTremorsaurusRoarCooldown() {
  const c = cfg()
  return c.roarIntervalMin + Math.random() * (c.roarIntervalMax - c.roarIntervalMin)
}

export function initTremorsaurusState(unit: BattleUnit) {
  unit.tremorRoarCooldown = rollTremorsaurusRoarCooldown()
  unit.tremorRoarTimeLeft = 0
}

function isBossEnemy(unit: BattleUnit): boolean {
  return MONSTER_MAP[unit.monsterId]?.tags.includes('boss') ?? false
}

export function startTremorsaurusRoar(
  unit: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  unit.tremorRoarTimeLeft = c.roarDuration
  unit.tremorRoarCooldown = 0
  unit.state = 'attack'
  unit.attackAnimTimer = c.roarDuration

  for (const enemy of units) {
    if (enemy.state === 'dead' || enemy.team === unit.team) continue
    if (isBossEnemy(enemy)) continue
    applyStatusEffect(enemy, 'fear')
  }
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.roarVisualRadius, 0.55)
}

/** 返回 true 表示本帧仍在吼叫中，应跳过普攻逻辑 */
export function tickTremorsaurusRoar(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
): boolean {
  if (unit.tremorRoarTimeLeft > 0) {
    unit.tremorRoarTimeLeft -= dt
    unit.state = 'attack'
    unit.attackAnimTimer = Math.max(unit.attackAnimTimer, unit.tremorRoarTimeLeft)
    if (unit.tremorRoarTimeLeft <= 0) {
      unit.tremorRoarCooldown = rollTremorsaurusRoarCooldown()
    }
    return true
  }

  unit.tremorRoarCooldown -= dt
  if (unit.tremorRoarCooldown <= 0) {
    startTremorsaurusRoar(unit, units, shockwaves)
    return true
  }
  return false
}

export function isTremorsaurusRoaring(unit: BattleUnit): boolean {
  return unit.tremorRoarTimeLeft > 0
}
