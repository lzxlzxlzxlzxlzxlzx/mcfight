import type { BattleUnit, Projectile } from '../../game/types'
import { BATTLE_FIELD } from '../../game/field'
import { MONSTER_MAP } from '../monsterMap'
import { applyStatusEffects } from '../../game/statusEffects'
import { dealDamageToUnit } from '../../game/unitDamage'

const PROJECTILE_HIT_PAD = 6

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

function isProjectileOffField(x: number, y: number) {
  const margin = 24
  return (
    x < -margin
    || x > BATTLE_FIELD.width + margin
    || y < -margin
    || y > BATTLE_FIELD.height + margin
  )
}

function normalizeAngleDelta(angle: number, center: number) {
  let d = angle - center
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

/** 单位是否处于向前飞行的弧形声波环带内（波前为 leading 点） */
function isUnitInArcWaveBand(
  u: BattleUnit,
  frontX: number,
  frontY: number,
  dirX: number,
  dirY: number,
  halfRad: number,
  arcRadius: number,
  bandWidth = 18,
) {
  const cx = frontX - dirX * arcRadius
  const cy = frontY - dirY * arcRadius
  const dx = u.x - cx
  const dy = u.y - cy
  const dist = Math.hypot(dx, dy)
  const pad = u.radius + PROJECTILE_HIT_PAD
  if (dist < arcRadius - bandWidth - pad || dist > arcRadius + bandWidth + pad) return false
  const aim = Math.atan2(dirY, dirX)
  const ang = Math.atan2(dy, dx)
  return Math.abs(normalizeAngleDelta(ang, aim)) <= halfRad
}

/** 检测投射物是否命中敌方单位（可被挡枪） */
export function findProjectileHitTarget(p: Projectile, units: BattleUnit[]): BattleUnit | null {
  let best: BattleUnit | null = null
  let bestDist = Infinity
  for (const u of units) {
    if (u.state === 'dead' || u.team === p.team) continue
    const d = Math.hypot(u.x - p.x, u.y - p.y)
    if (d <= u.radius + PROJECTILE_HIT_PAD && d < bestDist) {
      best = u
      bestDist = d
    }
  }
  return best
}

export function resolveProjectileHitOnUnit(p: Projectile, target: BattleUnit) {
  target.hp -= dealDamageToUnit(target, p.rawDamage, 'ranged')
  if (target.hp <= 0) {
    target.state = 'dead'
    return
  }
  const def = MONSTER_MAP[p.sourceMonsterId]
  if (def?.onHitEffects.length) applyStatusEffects(target, def.onHitEffects)
  if (p.statusOnHit?.length) applyStatusEffects(target, p.statusOnHit)
}

/** 直线飞行投射物：不追踪，可挡枪、可走位躲避 */
export function tickStraightProjectiles(
  projectiles: Projectile[],
  units: BattleUnit[],
  dt: number,
  kinds: Set<string>,
) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]
    const kind = p.kind ?? 'default'
    if (!kinds.has(kind)) continue

    const dirX = p.dirX
    const dirY = p.dirY
    if (dirX == null || dirY == null) {
      projectiles.splice(i, 1)
      continue
    }

    const step = p.speed * dt
    p.x += dirX * step
    p.y += dirY * step
    p.traveled = (p.traveled ?? 0) + step

    const hit = findProjectileHitTarget(p, units)
    if (hit) {
      resolveProjectileHitOnUnit(p, hit)
      projectiles.splice(i, 1)
      continue
    }

    if (p.maxTravel != null && (p.traveled ?? 0) >= p.maxTravel) {
      projectiles.splice(i, 1)
    }
  }
}

/** 直线穿透弹道：无限距离，路径上敌人均可受伤（每个敌人仅一次） */
export function tickPiercingProjectiles(
  projectiles: Projectile[],
  units: BattleUnit[],
  dt: number,
  kinds: Set<string>,
) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]
    const kind = p.kind ?? 'default'
    if (!kinds.has(kind)) continue

    const dirX = p.dirX
    const dirY = p.dirY
    if (dirX == null || dirY == null) {
      projectiles.splice(i, 1)
      continue
    }

    const prevX = p.x
    const prevY = p.y
    const step = p.speed * dt
    p.x += dirX * step
    p.y += dirY * step
    p.traveled = (p.traveled ?? 0) + step

    if (!p.hitEnemyIds) p.hitEnemyIds = []

    if (kind === 'forsaken_sonic' && p.arcRadius != null && p.arcHalfRad != null) {
      const arcR = p.arcRadius
      const halfRad = p.arcHalfRad
      for (const u of units) {
        if (u.state === 'dead' || u.team === p.team) continue
        if (p.hitEnemyIds.includes(u.id)) continue
        const inCurr = isUnitInArcWaveBand(u, p.x, p.y, dirX, dirY, halfRad, arcR)
        const inPrev = isUnitInArcWaveBand(u, prevX, prevY, dirX, dirY, halfRad, arcR)
        if (inCurr || inPrev) {
          resolveProjectileHitOnUnit(p, u)
          p.hitEnemyIds.push(u.id)
        }
      }
    } else {
      const halfW = (p.pierceHalfWidth ?? 12) + PROJECTILE_HIT_PAD
      for (const u of units) {
        if (u.state === 'dead' || u.team === p.team) continue
        if (p.hitEnemyIds.includes(u.id)) continue
        const d = distPointToSegment(u.x, u.y, prevX, prevY, p.x, p.y)
        if (d <= u.radius + halfW) {
          resolveProjectileHitOnUnit(p, u)
          p.hitEnemyIds.push(u.id)
        }
      }
    }

    if (isProjectileOffField(p.x, p.y)) {
      projectiles.splice(i, 1)
    }
  }
}
