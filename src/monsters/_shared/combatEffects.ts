import type { ActiveBeam, BattleUnit, ConeStrikeEffect, ShockwaveEffect } from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { dealDamageToUnit } from '../../game/unitDamage'
import { applyStatusEffects } from '../../game/statusEffects'
import { beamTickInterval, distPointToBeam, getTremorBeam } from '../alexscaves_tremorzilla/abilities'

let effectId = 1
export const eid = () => `fx-${effectId++}`

/** 激光跟随施法者与目标方向，源死亡则结束 */
export function syncBeamPose(beam: ActiveBeam, units: BattleUnit[]): boolean {
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
  beam.length = getTremorBeam().range
  source.facing = beam.dirX >= 0 ? 1 : -1
  return true
}

export function isChannelingBeam(unitId: string, beams: ActiveBeam[]) {
  return beams.some((b) => b.sourceId === unitId && b.kind !== 'harbinger_death')
}

export function spawnShockwave(
  shockwaves: ShockwaveEffect[],
  team: 0 | 1,
  x: number,
  y: number,
  maxRadius: number,
  duration = 0.45,
) {
  shockwaves.push({
    id: eid(),
    team,
    x,
    y,
    maxRadius,
    remaining: duration,
    duration,
  })
}

/** 瞬发扇形挥砍范围（与伤害判定扇形一致，短暂淡出） */
export function spawnInstantConeVisual(
  cones: ConeStrikeEffect[],
  team: 0 | 1,
  x: number,
  y: number,
  aimAngle: number,
  maxLength: number,
  angleDeg: number,
  duration = 0.65,
) {
  cones.push({
    id: eid(),
    team,
    x,
    y,
    aimAngle,
    maxLength,
    angleDeg,
    waveWidth: maxLength,
    startReach: maxLength,
    reach: maxLength,
    remaining: duration,
    duration,
    kind: 'instant',
  })
}

export function updateShockwaves(shockwaves: ShockwaveEffect[], dt: number) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    shockwaves[i].remaining -= dt
    if (shockwaves[i].remaining <= 0) shockwaves.splice(i, 1)
  }
}

export function updateActiveBeams(
  beams: ActiveBeam[],
  units: BattleUnit[],
  dt: number,
) {
  const interval = beamTickInterval()

  for (let i = beams.length - 1; i >= 0; i--) {
    const beam = beams[i]
    if (beam.kind === 'harbinger_death') continue
    if (!syncBeamPose(beam, units)) {
      beams.splice(i, 1)
      continue
    }

    beam.remaining -= dt
    beam.tickAccumulator += dt

    while (beam.tickAccumulator >= interval && beam.ticksRemaining > 0) {
      beam.tickAccumulator -= interval
      beam.ticksRemaining -= 1

      for (const u of units) {
        if (u.state === 'dead' || u.team === beam.team) continue
        const d = distPointToBeam(
          u.x, u.y,
          beam.originX, beam.originY,
          beam.dirX, beam.dirY,
          beam.length,
        )
        if (d <= beam.halfWidth + u.radius) {
          u.hp -= dealDamageToUnit(u, beam.damagePerTick, 'beam')
          if (u.hp <= 0) u.state = 'dead'
        }
      }
    }

    if (beam.remaining <= 0 || beam.ticksRemaining <= 0) {
      beams.splice(i, 1)
    }
  }
}

export function aoeDamageAtCenter(
  attacker: BattleUnit,
  centerX: number,
  centerY: number,
  radius: number,
  units: BattleUnit[],
  rawDamage?: number,
) {
  const def = MONSTER_MAP[attacker.monsterId]
  const damage = rawDamage ?? attacker.attack
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team) continue
    if (Math.hypot(u.x - centerX, u.y - centerY) <= radius + u.radius * 0.5) {
      u.hp -= dealDamageToUnit(u, damage, 'melee')
      if (u.hp <= 0) u.state = 'dead'
      else if (def.onHitEffects.length > 0) applyStatusEffects(u, def.onHitEffects)
    }
  }
}
