import type {
  ActiveBeam,
  BattleUnit,
  Projectile,
  ShockwaveEffect,
  StatusEffectType,
} from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { dealDamageToUnit } from '../../game/unitDamage'
import { clampUnitToField, clampDestinationPoint } from '../../game/field'
import { getHarbingerConfig } from './config'
import { applyStatusEffect } from '../../game/statusEffects'
import { eid, spawnShockwave } from '../_shared/combatEffects'

export const HARBINGER_ID = 'cataclysm_the_harbinger'

export type HarbingerSkillId = 'homing_missiles' | 'grenades' | 'charge' | 'death_laser'

const SKILL_CYCLE: HarbingerSkillId[] = ['homing_missiles', 'grenades', 'charge', 'death_laser']

function cfg() {
  return getHarbingerConfig()
}

export function isHarbinger(unit: BattleUnit | string) {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === HARBINGER_ID
}

export function initHarbingerState(unit: BattleUnit) {
  const c = cfg()
  unit.harbRegenAccum = 0
  unit.harbAttackMode = 'wither_missile'
  unit.harbModeTimer = c.modeSwitchInterval
  unit.harbSkillTimer = c.skillInterval
  unit.harbSkillIndex = 0
  unit.harbChargeTimeLeft = 0
  unit.harbChargeFromX = 0
  unit.harbChargeFromY = 0
  unit.harbChargeToX = 0
  unit.harbChargeToY = 0
  unit.harbChargeHits = {}
  unit.baseAttackInterval = c.witherMissileInterval
  unit.attackInterval = c.witherMissileInterval
}

export function harbingerEngageRange() {
  return cfg().attackRange
}

function pctDamage(base: number, pct: number, target: BattleUnit) {
  return base + target.maxHp * (pct / 100)
}

function applyDamage(
  attacker: BattleUnit,
  target: BattleUnit,
  rawDamage: number,
  status?: StatusEffectType[],
) {
  target.hp -= dealDamageToUnit(target, rawDamage, 'ranged')
  if (target.hp <= 0) {
    target.state = 'dead'
    if (isHarbinger(attacker)) {
      const c = cfg()
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + c.killHeal)
    }
  } else if (status?.length) {
    for (const s of status) applyStatusEffect(target, s)
  }
}

function applyAoE(
  attacker: BattleUnit,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  units: BattleUnit[],
  status?: StatusEffectType[],
) {
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team) continue
    if (Math.hypot(u.x - cx, u.y - cy) <= radius + u.radius * 0.4) {
      applyDamage(attacker, u, damage, status)
    }
  }
}

function syncAttackInterval(unit: BattleUnit) {
  const c = cfg()
  unit.baseAttackInterval = unit.harbAttackMode === 'wither_missile'
    ? c.witherMissileInterval
    : c.laserInterval
  unit.attackInterval = unit.baseAttackInterval
}

export function tickHarbingerPassive(unit: BattleUnit, dt: number) {
  const c = cfg()
  unit.harbRegenAccum += dt
  while (unit.harbRegenAccum >= 1) {
    unit.harbRegenAccum -= 1
    unit.hp = Math.min(unit.maxHp, unit.hp + c.regenPerSecond)
  }

  unit.harbModeTimer -= dt
  if (unit.harbModeTimer <= 0) {
    unit.harbAttackMode = unit.harbAttackMode === 'wither_missile' ? 'laser' : 'wither_missile'
    unit.harbModeTimer = c.modeSwitchInterval
    syncAttackInterval(unit)
  }

  unit.harbSkillTimer -= dt
}

export function isHarbingerBusy(unit: BattleUnit, beams: ActiveBeam[]) {
  if (unit.harbChargeTimeLeft > 0) return true
  return beams.some((b) => b.sourceId === unit.id && b.kind === 'harbinger_death')
}

export function isHarbingerChanneling(unitId: string, beams: ActiveBeam[]) {
  return beams.some((b) => b.sourceId === unitId && b.kind === 'harbinger_death')
}

export function nextHarbingerSkill(unit: BattleUnit): HarbingerSkillId {
  return SKILL_CYCLE[unit.harbSkillIndex % SKILL_CYCLE.length]
}

function spawnHarbProjectile(
  projectiles: Projectile[],
  attacker: BattleUnit,
  target: BattleUnit,
  kind: Projectile['kind'],
  rawDamage: number,
  speed: number,
  explodeRadius?: number,
  statusOnHit?: StatusEffectType[],
  opts?: { dirX?: number; dirY?: number; spawnOffset?: number },
) {
  const dirX = opts?.dirX
  const dirY = opts?.dirY
  const offset = opts?.spawnOffset ?? 0
  const ox = dirX != null && offset > 0 ? attacker.x + dirX * offset : attacker.x
  const oy = dirY != null && offset > 0 ? attacker.y + dirY * offset : attacker.y
  projectiles.push({
    id: eid(),
    team: attacker.team,
    x: ox,
    y: oy,
    targetId: target.id,
    speed,
    rawDamage,
    sourceId: attacker.id,
    sourceMonsterId: attacker.monsterId,
    kind,
    explodeRadius,
    statusOnHit,
    dirX,
    dirY,
  })
}

export function harbingerNormalAttack(
  unit: BattleUnit,
  target: BattleUnit,
  projectiles: Projectile[],
) {
  const c = cfg()
  unit.attackAnimTimer = c.attackAnimDuration
  unit.facing = target.x >= unit.x ? 1 : -1

  if (unit.harbAttackMode === 'wither_missile') {
    spawnHarbProjectile(
      projectiles,
      unit,
      target,
      'harb_wither',
      c.witherMissileDamage,
      300,
      c.witherMissileExplodeRadius,
      ['wither'],
    )
  } else {
    spawnHarbProjectile(
      projectiles,
      unit,
      target,
      'harb_laser',
      c.laserDamage,
      420,
      undefined,
      ['burn'],
    )
  }
}

function castHomingMissiles(
  unit: BattleUnit,
  target: BattleUnit,
  projectiles: Projectile[],
) {
  const c = cfg()
  const count = c.homingMissileCount
  const toTarget = Math.atan2(target.y - unit.y, target.x - unit.x)
  const spread = Math.PI * 0.9

  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1)
    const angle = toTarget + (t - 0.5) * spread
    const dirX = Math.cos(angle)
    const dirY = Math.sin(angle)
    spawnHarbProjectile(
      projectiles,
      unit,
      target,
      'harb_homing',
      c.homingMissileDamage,
      c.homingMissileSpeed,
      c.homingMissileExplodeRadius,
      ['wither'],
      { dirX, dirY, spawnOffset: 22 + i * 5 },
    )
  }
}

function castGrenades(
  unit: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  for (let i = 0; i < c.grenadeCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * c.grenadeScatterRadius
    const gx = unit.x + Math.cos(angle) * dist
    const gy = unit.y + Math.sin(angle) * dist
    applyAoE(unit, gx, gy, c.grenadeRadius, c.grenadeDamage, units, ['wither'])
    spawnShockwave(shockwaves, unit.team, gx, gy, c.grenadeRadius, 0.4)
  }
}

function startCharge(unit: BattleUnit, target: BattleUnit) {
  const c = cfg()
  unit.harbChargeFromX = unit.x
  unit.harbChargeFromY = unit.y
  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  const dest = clampDestinationPoint(target.x, target.y, unit.radius, tags)
  unit.harbChargeToX = dest.x
  unit.harbChargeToY = dest.y
  unit.harbChargeTimeLeft = c.chargeDuration
  unit.harbChargeHits = {}
  unit.state = 'attack'
  unit.attackAnimTimer = c.chargeDuration
  unit.facing = target.x >= unit.x ? 1 : -1
}

function castDeathLaser(
  unit: BattleUnit,
  target: BattleUnit,
  beams: ActiveBeam[],
) {
  const c = cfg()
  const dx = target.x - unit.x
  const dy = target.y - unit.y
  const len = Math.hypot(dx, dy) || 1
  unit.facing = dx >= 0 ? 1 : -1
  beams.push({
    id: eid(),
    team: unit.team,
    sourceId: unit.id,
    targetId: target.id,
    originX: unit.x,
    originY: unit.y,
    dirX: dx / len,
    dirY: dy / len,
    length: Math.max(400, len + 80),
    halfWidth: c.deathLaserHalfWidth,
    remaining: c.deathLaserDuration,
    tickAccumulator: 0,
    ticksRemaining: Math.ceil(c.deathLaserDuration),
    damagePerTick: 0,
    sourceMonsterId: unit.monsterId,
    kind: 'harbinger_death',
    baseDamagePerTick: c.deathLaserBasePerSec,
    pctMaxHpPerTick: c.deathLaserPctMaxHpPerSec,
    statusOnTick: ['burn'],
  })
  unit.attackAnimTimer = c.deathLaserDuration
  unit.state = 'attack'
}

export function tryCastHarbingerSkill(
  unit: BattleUnit,
  target: BattleUnit,
  units: BattleUnit[],
  projectiles: Projectile[],
  beams: ActiveBeam[],
  shockwaves: ShockwaveEffect[],
): boolean {
  if (unit.harbSkillTimer > 0) return false

  const skill = nextHarbingerSkill(unit)
  const c = cfg()
  unit.harbSkillTimer = c.skillInterval
  unit.harbSkillIndex = (unit.harbSkillIndex + 1) % SKILL_CYCLE.length
  unit.attackAnimTimer = c.attackAnimDuration

  switch (skill) {
    case 'homing_missiles':
      castHomingMissiles(unit, target, projectiles)
      break
    case 'grenades':
      castGrenades(unit, units, shockwaves)
      break
    case 'charge':
      startCharge(unit, target)
      break
    case 'death_laser':
      castDeathLaser(unit, target, beams)
      break
  }
  return true
}

export function tickHarbingerCharge(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
): boolean {
  if (unit.harbChargeTimeLeft <= 0) return false

  const c = cfg()
  const total = c.chargeDuration
  const elapsed = total - unit.harbChargeTimeLeft
  unit.harbChargeTimeLeft -= dt
  const t = Math.min(1, (elapsed + dt) / total)
  const prevX = unit.x
  const prevY = unit.y
  unit.x = unit.harbChargeFromX + (unit.harbChargeToX - unit.harbChargeFromX) * t
  unit.y = unit.harbChargeFromY + (unit.harbChargeToY - unit.harbChargeFromY) * t
  clampUnitToField(unit, MONSTER_MAP[unit.monsterId]?.tags ?? [])

  for (const u of units) {
    if (u.state === 'dead' || u.team === unit.team || unit.harbChargeHits[u.id]) continue
    const segDist = distPointToSegment(u.x, u.y, prevX, prevY, unit.x, unit.y)
    if (segDist <= u.radius + unit.radius * 0.6) {
      unit.harbChargeHits[u.id] = true
      applyDamage(unit, u, pctDamage(c.chargeDamageBase, c.chargeDamagePctMaxHp, u))
    }
  }

  if (unit.harbChargeTimeLeft <= 0) {
    unit.harbChargeTimeLeft = 0
    return false
  }
  return true
}

function distPointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq <= 0.001) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const cx = ax + dx * t
  const cy = ay + dy * t
  return Math.hypot(px - cx, py - cy)
}

function syncDeathBeamPose(beam: ActiveBeam, units: BattleUnit[]): boolean {
  const source = units.find((u) => u.id === beam.sourceId && u.state !== 'dead')
  if (!source) return false
  beam.originX = source.x
  beam.originY = source.y
  const target = units.find((u) => u.id === beam.targetId && u.state !== 'dead')
  let dx = beam.dirX
  let dy = beam.dirY
  if (target) {
    dx = target.x - source.x
    dy = target.y - source.y
  }
  const len = Math.hypot(dx, dy) || 1
  beam.dirX = dx / len
  beam.dirY = dy / len
  beam.length = Math.max(beam.length, len + 60)
  source.facing = beam.dirX >= 0 ? 1 : -1
  return true
}

export function tickHarbingerDeathBeams(
  beams: ActiveBeam[],
  units: BattleUnit[],
  dt: number,
) {
  for (let i = beams.length - 1; i >= 0; i--) {
    const beam = beams[i]
    if (beam.kind !== 'harbinger_death') continue

    if (!syncDeathBeamPose(beam, units)) {
      beams.splice(i, 1)
      continue
    }

    const attacker = units.find((u) => u.id === beam.sourceId && u.state !== 'dead')
    const target = units.find((u) => u.id === beam.targetId && u.state !== 'dead')
    if (!attacker || !target) {
      beams.splice(i, 1)
      continue
    }

    beam.remaining -= dt
    beam.tickAccumulator += dt

    while (beam.tickAccumulator >= 1 && beam.ticksRemaining > 0) {
      beam.tickAccumulator -= 1
      beam.ticksRemaining -= 1
      const raw = pctDamage(
        beam.baseDamagePerTick ?? 0,
        beam.pctMaxHpPerTick ?? 0,
        target,
      )
      applyDamage(attacker, target, raw, beam.statusOnTick)
    }

    if (beam.remaining <= 0 || beam.ticksRemaining <= 0) {
      beams.splice(i, 1)
    }
  }
}

function resolveProjectileHit(
  p: Projectile,
  hitX: number,
  hitY: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
) {
  const attacker = units.find((u) => u.id === p.sourceId && u.state !== 'dead')
  if (!attacker) return

  if (p.kind === 'harb_laser') {
    const target = units.find((u) => u.id === p.targetId && u.state !== 'dead')
    if (target) applyDamage(attacker, target, p.rawDamage, p.statusOnHit)
    return
  }

  const radius = p.explodeRadius ?? 40
  applyAoE(attacker, hitX, hitY, radius, p.rawDamage, units, p.statusOnHit)
  spawnShockwave(shockwaves, p.team, hitX, hitY, radius, 0.35)
}

export function tickHarbingerProjectiles(
  projectiles: Projectile[],
  units: BattleUnit[],
  dt: number,
  shockwaves: ShockwaveEffect[],
) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]
    if (!p.kind || p.kind === 'default') continue

    const target = units.find((u) => u.id === p.targetId && u.state !== 'dead')
    if (!target && p.kind !== 'harb_homing') {
      projectiles.splice(i, 1)
      continue
    }

    if (p.kind === 'harb_homing') {
      if (!target) {
        projectiles.splice(i, 1)
        continue
      }
      const toTx = target.x - p.x
      const toTy = target.y - p.y
      const tLen = Math.hypot(toTx, toTy)
      if (tLen < target.radius + 10) {
        resolveProjectileHit(p, p.x, p.y, units, shockwaves)
        projectiles.splice(i, 1)
        continue
      }
      const aimX = toTx / tLen
      const aimY = toTy / tLen
      let dx = p.dirX ?? aimX
      let dy = p.dirY ?? aimY
      const steer = Math.min(1, 4.5 * dt)
      dx += (aimX - dx) * steer
      dy += (aimY - dy) * steer
      const dLen = Math.hypot(dx, dy) || 1
      p.dirX = dx / dLen
      p.dirY = dy / dLen
      const step = p.speed * dt
      p.x += p.dirX * step
      p.y += p.dirY * step
      continue
    }

    const tx = target?.x ?? p.x
    const ty = target?.y ?? p.y
    const dx = tx - p.x
    const dy = ty - p.y
    const dist = Math.hypot(dx, dy)

    if (dist < (target?.radius ?? 12) + 10) {
      resolveProjectileHit(p, p.x, p.y, units, shockwaves)
      projectiles.splice(i, 1)
      continue
    }

    const step = p.speed * dt
    p.x += (dx / dist) * step
    p.y += (dy / dist) * step
  }
}
