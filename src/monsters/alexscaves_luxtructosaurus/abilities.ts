import type { BattleUnit, LavaPatch, MeteorEffect, ShockwaveEffect } from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { clampLeapDestination, clampUnitToField, setLeapArcPosition } from '../../game/field'
import { getDamageAfterArmor } from '../../game/damage'
import { getLuxConfig } from './config'
import { applyStatusEffect, applyStatusEffects } from '../../game/statusEffects'
import { eid, spawnShockwave } from '../_shared/combatEffects'

export const LUX_ID = 'alexscaves_luxtructosaurus'

function lux() {
  return getLuxConfig()
}

export function isLuxtructosaurus(unit: BattleUnit | string) {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === LUX_ID
}

export function initLuxState(unit: BattleUnit) {
  const cfg = lux()
  unit.luxNextStomp = false
  unit.meteorTimer = cfg.meteorInterval
  unit.leapTimeLeft = 0
  unit.leapCooldown = 0
}

function groundAoeDamage(
  attacker: BattleUnit,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  units: BattleUnit[],
  ignite = false,
) {
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team) continue
    if (u.moveType !== 'ground') continue
    if (Math.hypot(u.x - cx, u.y - cy) <= radius + u.radius * 0.45) {
      const def = MONSTER_MAP[u.monsterId]
      u.hp -= getDamageAfterArmor(damage, u.armor, def.armorToughness ?? 0)
      if (u.hp <= 0) u.state = 'dead'
      else {
        if (ignite) applyStatusEffect(u, 'burn')
        if (def.onHitEffects.length > 0) applyStatusEffects(u, def.onHitEffects)
      }
    }
  }
}

function allAoeDamage(
  attackerTeam: 0 | 1,
  cx: number,
  cy: number,
  radius: number,
  damage: number,
  units: BattleUnit[],
  ignite = false,
) {
  for (const u of units) {
    if (u.state === 'dead' || u.team === attackerTeam) continue
    if (Math.hypot(u.x - cx, u.y - cy) <= radius + u.radius * 0.45) {
      const def = MONSTER_MAP[u.monsterId]
      u.hp -= getDamageAfterArmor(damage, u.armor, def.armorToughness ?? 0)
      if (u.hp <= 0) u.state = 'dead'
      else if (ignite) applyStatusEffect(u, 'burn')
    }
  }
}

function spawnFireRing(shockwaves: ShockwaveEffect[], team: 0 | 1, x: number, y: number, radius: number) {
  spawnShockwave(shockwaves, team, x, y, radius, 0.5)
  const sw = shockwaves[shockwaves.length - 1]
  if (sw) sw.kind = 'fire'
}

export function startLeap(unit: BattleUnit, target: BattleUnit) {
  const cfg = lux()
  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  unit.leapFromX = unit.x
  unit.leapFromY = unit.y
  unit.leapToX = target.x
  unit.leapToY = target.y
  clampLeapDestination(unit, tags)
  unit.leapTimeLeft = cfg.leapDuration
  unit.leapCooldown = cfg.leapCooldown
  unit.state = 'attack'
  unit.attackAnimTimer = cfg.leapDuration
  unit.facing = target.x >= unit.x ? 1 : -1
}

export function tickLeap(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
): boolean {
  const cfg = lux()
  if (unit.leapTimeLeft <= 0) return false

  const tags = MONSTER_MAP[unit.monsterId]?.tags ?? []
  const total = cfg.leapDuration
  const elapsed = total - unit.leapTimeLeft
  unit.leapTimeLeft -= dt
  const t = Math.min(1, (elapsed + dt) / total)
  setLeapArcPosition(unit, tags, t, 55)
  unit.state = 'attack'

  if (unit.leapTimeLeft <= 0) {
    unit.x = unit.leapToX
    unit.y = unit.leapToY
    clampUnitToField(unit, tags)
    groundAoeDamage(unit, unit.x, unit.y, cfg.leapRadius, cfg.leapDamage, units, true)
    spawnFireRing(shockwaves, unit.team, unit.x, unit.y, cfg.leapRadius)
    unit.leapTimeLeft = 0
    return false
  }
  return true
}

export function luxTailSwipe(unit: BattleUnit, units: BattleUnit[], shockwaves: ShockwaveEffect[]) {
  const cfg = lux()
  groundAoeDamage(unit, unit.x, unit.y, cfg.tailRadius, cfg.tailDamage, units, true)
  spawnFireRing(shockwaves, unit.team, unit.x, unit.y, cfg.tailRadius)
  unit.attackAnimTimer = cfg.meleeAnimDuration
  unit.luxNextStomp = true
}

export function luxStomp(unit: BattleUnit, target: BattleUnit, units: BattleUnit[], shockwaves: ShockwaveEffect[]) {
  const cfg = lux()
  groundAoeDamage(unit, target.x, target.y, cfg.stompRadius, cfg.stompDamage, units, true)
  spawnFireRing(shockwaves, unit.team, target.x, target.y, cfg.stompRadius)
  unit.attackAnimTimer = cfg.meleeAnimDuration
  unit.luxNextStomp = false
}

export function canLeap(dist: number, inMelee: boolean, leapCooldown: number) {
  const cfg = lux()
  return leapCooldown <= 0 && !inMelee && dist > cfg.leapPreferDist && dist <= cfg.leapMaxRange
}

export function shouldLeap(dist: number, inMelee: boolean, leapCooldown = 0) {
  return canLeap(dist, inMelee, leapCooldown)
}

export function spawnMeteorNear(
  unit: BattleUnit,
  meteors: MeteorEffect[],
) {
  const cfg = lux()
  const angle = Math.random() * Math.PI * 2
  const dist = Math.random() * cfg.meteorSpawnRadius
  const tx = unit.x + Math.cos(angle) * dist
  const ty = unit.y + Math.sin(angle) * dist
  const x = Math.max(40, Math.min(920, tx))
  const y = Math.max(40, Math.min(500, ty))

  meteors.push({
    id: eid(),
    team: unit.team,
    sourceId: unit.id,
    x,
    y,
    fallProgress: 0,
    duration: cfg.meteorFallDuration,
    explodeRadius: cfg.meteorExplodeRadius,
    damage: cfg.meteorDamage,
  })
}

export function tickMeteors(
  meteors: MeteorEffect[],
  dt: number,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
  lavaPatches: LavaPatch[],
) {
  const cfg = lux()
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.fallProgress += dt / m.duration
    if (m.fallProgress < 1) continue

    allAoeDamage(m.team, m.x, m.y, m.explodeRadius, m.damage, units, true)
    spawnFireRing(shockwaves, m.team, m.x, m.y, m.explodeRadius)
    const sw = shockwaves[shockwaves.length - 1]
    if (sw) sw.kind = 'meteor'

    lavaPatches.push({
      id: eid(),
      team: m.team,
      x: m.x,
      y: m.y,
      radius: cfg.lavaRadius,
      remaining: cfg.lavaDuration,
      dotTimer: 0,
    })

    meteors.splice(i, 1)
  }
}

export function tickLuxMeteorPassive(unit: BattleUnit, dt: number, meteors: MeteorEffect[]) {
  const cfg = lux()
  if (unit.state === 'dead') return
  unit.meteorTimer -= dt
  if (unit.meteorTimer <= 0) {
    spawnMeteorNear(unit, meteors)
    unit.meteorTimer = cfg.meteorInterval
  }
}

export function tickLava(lavaPatches: LavaPatch[], units: BattleUnit[], dt: number) {
  const cfg = lux()
  for (let i = lavaPatches.length - 1; i >= 0; i--) {
    const lava = lavaPatches[i]
    lava.remaining -= dt
    if (lava.remaining <= 0) {
      lavaPatches.splice(i, 1)
      continue
    }

    lava.dotTimer += dt
    if (lava.dotTimer < 1) continue
    lava.dotTimer -= 1

    for (const u of units) {
      if (u.state === 'dead' || u.moveType !== 'ground') continue
      if (MONSTER_MAP[u.monsterId].tags.includes('fire_immune')) continue
      if (Math.hypot(u.x - lava.x, u.y - lava.y) <= lava.radius + u.radius * 0.35) {
        u.hp -= cfg.lavaDps
        if (u.hp <= 0) u.state = 'dead'
        else applyStatusEffect(u, 'burn')
      }
    }
  }
}

export function luxEngageRange() {
  const cfg = lux()
  return Math.max(cfg.meleeRange, cfg.leapMaxRange)
}
