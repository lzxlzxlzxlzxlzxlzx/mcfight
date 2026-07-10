import type { BattleUnit, ForsakenArcWave, ShockwaveEffect } from '../../game/types'
import { BATTLE_FIELD } from '../../game/field'
import { MONSTER_MAP } from '../monsterMap'
import { clampUnitToField, clampLeapDestination, setLeapArcPosition } from '../../game/field'
import { isWithinCastRange } from '../../game/unitCombat'
import { dealDamageToUnit } from '../../game/unitDamage'
import { eid, spawnShockwave } from '../_shared/combatEffects'
import { getForsakenConfig, type ForsakenSkill } from './config'

export const FORSAKEN_ID = 'alexscaves_forsaken'

function cfg() {
  return getForsakenConfig()
}

export function initForsakenState(unit: BattleUnit) {
  unit.forsakenRegenAccum = 0
  unit.forsakenCastTimeLeft = 0
  unit.forsakenPendingSkill = null
  unit.forsakenTicksDone = 0
  unit.forsakenAimAngle = 0
  unit.forsakenLeapCooldown = 0
  unit.leapTimeLeft = 0
}

export function forsakenCombatRange() {
  const c = cfg()
  return Math.max(c.biteRange, c.hammerRange, c.sonicRadius)
}

export function forsakenEngageRange() {
  const c = cfg()
  return Math.max(
    forsakenCombatRange(),
    c.leapTriggerDistance,
    c.engageRange,
  )
}

export function isForsakenBusy(unit: BattleUnit): boolean {
  return unit.forsakenCastTimeLeft > 0 || unit.leapTimeLeft > 0
}

export function tickForsakenRegen(unit: BattleUnit, dt: number) {
  const c = cfg()
  unit.forsakenRegenAccum += dt
  const interval = 1 / c.regenPerSecond
  while (unit.forsakenRegenAccum >= interval) {
    unit.forsakenRegenAccum -= interval
    unit.hp = Math.min(unit.maxHp, unit.hp + c.regenPerSecond)
  }
}

export function isForsakenSkillInRange(
  skill: ForsakenSkill,
  _unit: BattleUnit,
  target: BattleUnit,
  dist: number,
): boolean {
  const c = cfg()
  switch (skill) {
    case 'bite':
      return isWithinCastRange(dist, c.biteRange, target)
    case 'hammer':
      return isWithinCastRange(dist, c.hammerRange, target) && target.moveType === 'ground'
    case 'sonic':
      return isWithinCastRange(dist, c.sonicRadius, target)
    case 'ranged_sonic':
      return dist >= c.rangedSonicMinDistance
  }
}

export function pickForsakenSkill(
  unit: BattleUnit,
  target: BattleUnit,
  dist: number,
): ForsakenSkill | null {
  const c = cfg()
  const skills: ForsakenSkill[] = ['bite', 'hammer', 'sonic', 'ranged_sonic']
  const available = skills.filter((s) => isForsakenSkillInRange(s, unit, target, dist))
  if (!available.length) return null
  if (dist >= c.rangedSonicMinDistance && dist > c.biteRange + 10) {
    const ranged = available.filter((s) => s === 'ranged_sonic')
    if (ranged.length) return 'ranged_sonic'
  }
  return available[Math.floor(Math.random() * available.length)]
}

export function shouldForsakenApproachLeap(unit: BattleUnit, dist: number): boolean {
  const c = cfg()
  if (isForsakenBusy(unit)) return false
  if (unit.forsakenLeapCooldown > 0) return false
  return dist > c.leapTriggerDistance
}

function leapStandoffDistance(unit: BattleUnit, target: BattleUnit) {
  const combat = forsakenCombatRange()
  const minDist = target.radius + unit.radius + 6
  const idealDist = combat * 0.82 + target.radius * 0.35
  return Math.max(minDist, idealDist)
}

/** 根据接近方向与占位，计算不与他人重叠的落点 */
function computeForsakenLeapDestination(
  unit: BattleUnit,
  target: BattleUnit,
  units: BattleUnit[],
): { x: number; y: number } {
  const baseAngle = Math.atan2(unit.y - target.y, unit.x - target.x)
  const idNum = Number.parseInt(unit.id.replace(/\D/g, ''), 10) || 0
  const spread = ((idNum % 8) - 3.5) * 0.42
  const standOff = leapStandoffDistance(unit, target)

  let lx = target.x + Math.cos(baseAngle + spread) * standOff
  let ly = target.y + Math.sin(baseAngle + spread) * standOff

  const obstacles: { x: number; y: number; radius: number }[] = []
  for (const other of units) {
    if (other.id === unit.id || other.state === 'dead') continue
    if (other.leapTimeLeft > 0) {
      obstacles.push({ x: other.leapToX, y: other.leapToY, radius: other.radius })
    } else {
      obstacles.push({ x: other.x, y: other.y, radius: other.radius })
    }
  }

  for (let iter = 0; iter < 10; iter++) {
    let adjusted = false
    for (const obs of obstacles) {
      const dx = lx - obs.x
      const dy = ly - obs.y
      const d = Math.hypot(dx, dy)
      const minD = unit.radius + obs.radius + 6
      if (d < minD) {
        const push = d > 0 ? (minD - d) / d : 1
        const angle = d > 0 ? Math.atan2(dy, dx) : baseAngle + spread
        lx += Math.cos(angle) * push * minD
        ly += Math.sin(angle) * push * minD
        adjusted = true
      }
    }
    if (!adjusted) break
  }

  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  const probe = { x: lx, y: ly, radius: unit.radius }
  clampUnitToField(probe, tags)
  lx = probe.x
  ly = probe.y

  const c = cfg()
  const maxStandoff = c.leapTriggerDistance * 0.92
  const distFromTarget = Math.hypot(lx - target.x, ly - target.y)
  if (distFromTarget > maxStandoff) {
    const pull = Math.atan2(ly - target.y, lx - target.x)
    lx = target.x + Math.cos(pull) * maxStandoff
    ly = target.y + Math.sin(pull) * maxStandoff
    probe.x = lx
    probe.y = ly
    clampUnitToField(probe, tags)
    lx = probe.x
    ly = probe.y
  }

  return { x: lx, y: ly }
}

function resolveForsakenLandingOverlap(unit: BattleUnit, units: BattleUnit[]) {
  for (let iter = 0; iter < 8; iter++) {
    let moved = false
    for (const other of units) {
      if (other.id === unit.id || other.state === 'dead') continue
      const ox = other.leapTimeLeft > 0 ? other.leapToX : other.x
      const oy = other.leapTimeLeft > 0 ? other.leapToY : other.y
      const dx = unit.x - ox
      const dy = unit.y - oy
      const d = Math.hypot(dx, dy)
      const minD = unit.radius + other.radius + 4
      if (d < minD) {
        const push = d > 0 ? (minD - d) / d : 1
        const angle = d > 0 ? Math.atan2(dy, dx) : 0
        unit.x += Math.cos(angle) * push * minD
        unit.y += Math.sin(angle) * push * minD
        moved = true
      }
    }
    if (!moved) break
  }
  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  clampUnitToField(unit, tags)
}

export function startForsakenApproachLeap(
  unit: BattleUnit,
  target: BattleUnit,
  units: BattleUnit[],
) {
  const c = cfg()
  const dest = computeForsakenLeapDestination(unit, target, units)
  unit.leapFromX = unit.x
  unit.leapFromY = unit.y
  unit.leapToX = dest.x
  unit.leapToY = dest.y
  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  clampLeapDestination(unit, tags)
  unit.leapTimeLeft = c.leapDuration
  unit.forsakenLeapCooldown = c.leapCooldown
  unit.state = 'attack'
  unit.attackAnimTimer = c.leapDuration
  unit.facing = target.x >= unit.x ? 1 : -1
}

export function tickForsakenApproachLeap(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
): boolean {
  const c = cfg()
  if (unit.leapTimeLeft <= 0) return false

  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  const total = c.leapDuration
  const elapsed = total - unit.leapTimeLeft
  unit.leapTimeLeft -= dt
  const t = Math.min(1, (elapsed + dt) / total)
  setLeapArcPosition(unit, tags, t, 38)
  unit.state = 'attack'

  if (unit.leapTimeLeft <= 0) {
    unit.x = unit.leapToX
    unit.y = unit.leapToY
    clampUnitToField(unit, tags)
    resolveForsakenLandingOverlap(unit, units)
    unit.leapTimeLeft = 0
    return false
  }
  return true
}

function applyBiteHit(unit: BattleUnit, target: BattleUnit) {
  const c = cfg()
  if (target.state === 'dead' || target.team === unit.team) return
  const dist = Math.hypot(target.x - unit.x, target.y - unit.y)
  if (!isWithinCastRange(dist, c.biteRange, target)) return
  target.hp -= dealDamageToUnit(target, c.biteDamage, 'melee')
  if (target.hp <= 0) target.state = 'dead'
}

function applyHammer(unit: BattleUnit, target: BattleUnit, units: BattleUnit[], shockwaves: ShockwaveEffect[]) {
  const c = cfg()
  unit.facing = target.x >= unit.x ? 1 : -1
  for (const u of units) {
    if (u.state === 'dead' || u.team === unit.team || u.moveType === 'fly') continue
    if (Math.hypot(u.x - target.x, u.y - target.y) <= c.hammerRadius + u.radius * 0.45) {
      u.hp -= dealDamageToUnit(u, c.hammerDamage, 'melee')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
  spawnShockwave(shockwaves, unit.team, target.x, target.y, c.hammerRadius, 0.38)
}

function applySonicTick(unit: BattleUnit, units: BattleUnit[], shockwaves: ShockwaveEffect[]) {
  const c = cfg()
  for (const u of units) {
    if (u.state === 'dead' || u.team === unit.team) continue
    if (Math.hypot(u.x - unit.x, u.y - unit.y) <= c.sonicRadius + u.radius * 0.45) {
      u.hp -= dealDamageToUnit(u, c.sonicDamage, 'ranged')
      if (u.hp <= 0) u.state = 'dead'
    }
  }
  spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.sonicRadius * 0.9, 0.28)
}

export function spawnForsakenArcWave(
  unit: BattleUnit,
  waves: ForsakenArcWave[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  const angle = unit.forsakenAimAngle
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  const spawnDist = unit.radius + c.rangedSonicArcRadius * 0.35
  const sx = unit.x + dirX * spawnDist
  const sy = unit.y + dirY * spawnDist
  const halfRad = (c.rangedSonicArcHalfDeg * Math.PI) / 180
  waves.push({
    id: eid(),
    team: unit.team,
    sourceId: unit.id,
    sourceMonsterId: unit.monsterId,
    x: sx,
    y: sy,
    dirX,
    dirY,
    speed: c.rangedSonicSpeed,
    arcRadius: c.rangedSonicArcRadius,
    arcHalfRad: halfRad,
    arcBandWidth: 22,
    damage: c.rangedSonicDamage,
    hitEnemyIds: [],
  })
  spawnShockwave(shockwaves, unit.team, sx, sy, c.rangedSonicArcRadius * 0.55, 0.42)
}

function normalizeAngleDelta(angle: number, center: number) {
  let d = angle - center
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

function isUnitInArcWaveBand(
  u: BattleUnit,
  frontX: number,
  frontY: number,
  dirX: number,
  dirY: number,
  halfRad: number,
  arcRadius: number,
  bandWidth: number,
) {
  const cx = frontX - dirX * arcRadius
  const cy = frontY - dirY * arcRadius
  const dx = u.x - cx
  const dy = u.y - cy
  const dist = Math.hypot(dx, dy)
  const pad = u.radius + 6
  if (dist < arcRadius - bandWidth - pad || dist > arcRadius + pad) return false
  const aim = Math.atan2(dirY, dirX)
  const ang = Math.atan2(dy, dx)
  return Math.abs(normalizeAngleDelta(ang, aim)) <= halfRad
}

export function getForsakenArcWaveGeom(wave: ForsakenArcWave) {
  const aimAngle = Math.atan2(wave.dirY, wave.dirX)
  const cx = wave.x - wave.dirX * wave.arcRadius
  const cy = wave.y - wave.dirY * wave.arcRadius
  const outerReach = wave.arcRadius
  const innerReach = Math.max(8, wave.arcRadius - wave.arcBandWidth)
  return {
    cx,
    cy,
    aimAngle,
    halfRad: wave.arcHalfRad,
    outerReach,
    innerReach,
    waveWidth: wave.arcBandWidth,
    start: aimAngle - wave.arcHalfRad,
    end: aimAngle + wave.arcHalfRad,
  }
}

export function tickForsakenArcWaves(
  waves: ForsakenArcWave[],
  units: BattleUnit[],
  dt: number,
) {
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i]
    const prevX = w.x
    const prevY = w.y
    const step = w.speed * dt
    w.x += w.dirX * step
    w.y += w.dirY * step

    for (const u of units) {
      if (u.state === 'dead' || u.team === w.team) continue
      if (w.hitEnemyIds.includes(u.id)) continue
      const inCurr = isUnitInArcWaveBand(
        u, w.x, w.y, w.dirX, w.dirY, w.arcHalfRad, w.arcRadius, w.arcBandWidth,
      )
      const inPrev = isUnitInArcWaveBand(
        u, prevX, prevY, w.dirX, w.dirY, w.arcHalfRad, w.arcRadius, w.arcBandWidth,
      )
      if (inCurr || inPrev) {
        u.hp -= dealDamageToUnit(u, w.damage, 'ranged')
        if (u.hp <= 0) u.state = 'dead'
        w.hitEnemyIds.push(u.id)
      }
    }

    const margin = w.arcRadius + 40
    if (
      w.x < -margin
      || w.x > BATTLE_FIELD.width + margin
      || w.y < -margin
      || w.y > BATTLE_FIELD.height + margin
    ) {
      waves.splice(i, 1)
    }
  }
}

export function startForsakenCast(
  unit: BattleUnit,
  skill: ForsakenSkill,
  target: BattleUnit,
) {
  const c = cfg()
  unit.forsakenPendingSkill = skill
  unit.forsakenTicksDone = 0
  unit.forsakenCastTimeLeft = c.skillCastDuration
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.forsakenAimAngle = Math.atan2(target.y - unit.y, target.x - unit.x)
  unit.state = 'attack'
  unit.attackAnimTimer = c.skillCastDuration

  if (skill === 'hammer') {
    unit.forsakenCastTimeLeft = 0.35
    unit.attackAnimTimer = 0.35
  } else if (skill === 'ranged_sonic') {
    unit.forsakenCastTimeLeft = c.rangedSonicCastDuration
    unit.attackAnimTimer = c.rangedSonicCastDuration
  }
}

export function tickForsakenCast(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
  forsakenArcWaves: ForsakenArcWave[],
): boolean {
  if (unit.forsakenCastTimeLeft <= 0) return false

  const c = cfg()
  const skill = unit.forsakenPendingSkill
  if (!skill) {
    unit.forsakenCastTimeLeft = 0
    unit.forsakenTicksDone = 0
    return false
  }

  unit.state = 'attack'
  const duration = skill === 'hammer'
    ? 0.35
    : skill === 'ranged_sonic'
      ? c.rangedSonicCastDuration
      : c.skillCastDuration
  unit.forsakenCastTimeLeft -= dt
  const elapsed = duration - unit.forsakenCastTimeLeft

  const target = unit.targetId
    ? units.find((u) => u.id === unit.targetId && u.state !== 'dead')
    : null

  if (skill === 'bite' && target) {
    const interval = c.skillCastDuration / c.biteHits
    while (unit.forsakenTicksDone < c.biteHits && elapsed >= interval * (unit.forsakenTicksDone + 1)) {
      applyBiteHit(unit, target)
      unit.forsakenTicksDone++
      unit.facing = target.x >= unit.x ? 1 : -1
    }
  } else if (skill === 'hammer' && target && unit.forsakenTicksDone === 0 && elapsed >= 0.12) {
    applyHammer(unit, target, units, shockwaves)
    unit.forsakenTicksDone = 1
  } else if (skill === 'sonic') {
    const interval = c.skillCastDuration / c.sonicHits
    while (unit.forsakenTicksDone < c.sonicHits && elapsed >= interval * (unit.forsakenTicksDone + 1)) {
      applySonicTick(unit, units, shockwaves)
      unit.forsakenTicksDone++
    }
  } else if (skill === 'ranged_sonic') {
    if (unit.forsakenTicksDone === 0 && elapsed >= 0.02) {
      if (target) {
        unit.facing = target.x >= unit.x ? 1 : -1
        unit.forsakenAimAngle = Math.atan2(target.y - unit.y, target.x - unit.x)
      }
      spawnForsakenArcWave(unit, forsakenArcWaves, shockwaves)
      unit.forsakenTicksDone = 1
    }
  }

  if (unit.forsakenCastTimeLeft > 0) return true

  unit.forsakenPendingSkill = null
  unit.forsakenTicksDone = 0
  unit.attackAnimTimer = 0.25
  return false
}
