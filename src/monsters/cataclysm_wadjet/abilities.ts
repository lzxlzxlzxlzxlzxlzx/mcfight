import type {
  BattleUnit,
  ConeStrikeEffect,
  LinearSandTornado,
  ObeliskBarrage,
  ShockwaveEffect,
} from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { getDamageAfterArmor } from '../../game/damage'
import { BATTLE_FIELD } from '../../game/field'
import { getWadjetConfig } from './config'
import { isUnitInStompSector } from '../cataclysm_ancient_remnant/abilities'
import { eid, spawnShockwave } from '../_shared/combatEffects'

export const WADJET_ID = 'cataclysm_wadjet'

export type WadjetSkillId = 'sweep' | 'tornado' | 'obelisk'

function cfg() {
  return getWadjetConfig()
}

export function isWadjet(unit: BattleUnit | string) {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === WADJET_ID
}

export function initWadjetState(unit: BattleUnit) {
  unit.wadjetCastTimeLeft = 0
  unit.wadjetPendingSkill = null
  unit.wadjetCycleSkill = 'sweep'
  unit.wadjetObeliskCooldown = 0
  unit.wadjetSweepStrikesDone = 0
  unit.wadjetCastAimAngle = 0
}

export function wadjetEngageRange() {
  return cfg().engageRange
}

function sweepHalfAngleRad() {
  return (cfg().sweepConeAngleDeg * Math.PI) / 180 / 2
}

function applySweepDamage(attacker: BattleUnit, units: BattleUnit[], aimAngle: number) {
  const c = cfg()
  const halfRad = sweepHalfAngleRad()
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team || u.moveType === 'fly') continue
    if (isUnitInStompSector(attacker.x, attacker.y, aimAngle, halfRad, c.sweepConeLength, u)) {
      const def = MONSTER_MAP[u.monsterId]
      u.hp -= getDamageAfterArmor(c.sweepDamage, u.armor, def.armorToughness ?? 0)
      if (u.hp <= 0) u.state = 'dead'
    }
  }
}

function spawnWadjetObeliskBarrage(barrages: ObeliskBarrage[], unit: BattleUnit) {
  const c = cfg()
  barrages.push({
    id: eid(),
    team: unit.team,
    sourceId: unit.id,
    cx: unit.x,
    cy: unit.y,
    maxRadius: c.obeliskMaxRadius,
    ringCount: c.obeliskRingCount,
    nextRingIndex: 0,
    ringTimer: 0,
    baseDamage: c.obeliskDamage,
    pctMaxHp: 0,
    hitEnemyIds: [],
    ringInterval: c.obeliskRingInterval,
    fallDuration: c.obeliskFallDuration,
    impactRadius: c.obeliskImpactRadius,
    spacing: c.obeliskSpacing,
  })
}

function spawnSweepVisual(cones: ConeStrikeEffect[], unit: BattleUnit, aimAngle: number) {
  const c = cfg()
  const duration = c.skillCastDuration * 0.45
  cones.push({
    id: eid(),
    team: unit.team,
    x: unit.x,
    y: unit.y,
    aimAngle,
    maxLength: c.sweepConeLength,
    angleDeg: c.sweepConeAngleDeg,
    waveWidth: c.sweepWaveWidth,
    startReach: c.sweepWaveWidth * 0.55,
    reach: c.sweepWaveWidth * 0.55,
    remaining: duration,
    duration,
  })
}

function spawnLinearTornado(tornados: LinearSandTornado[], unit: BattleUnit, aimAngle: number) {
  const c = cfg()
  tornados.push({
    id: eid(),
    team: unit.team,
    sourceId: unit.id,
    x: unit.x + Math.cos(aimAngle) * (unit.radius + 8),
    y: unit.y + Math.sin(aimAngle) * (unit.radius + 8),
    dirX: Math.cos(aimAngle),
    dirY: Math.sin(aimAngle),
    speed: c.tornadoSpeed,
    hitRadius: c.tornadoHitRadius,
    damage: c.tornadoDamage,
    hitEnemyIds: [],
  })
}

function executeWadjetSkill(
  unit: BattleUnit,
  skill: WadjetSkillId,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
  linearTornados: LinearSandTornado[],
  obeliskBarrages: ObeliskBarrage[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  const aimAngle = unit.wadjetCastAimAngle

  switch (skill) {
    case 'sweep':
      applySweepDamage(unit, units, aimAngle)
      unit.wadjetSweepStrikesDone = 1
      spawnSweepVisual(coneStrikes, unit, aimAngle)
      spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.sweepConeLength * 0.35, 0.3)
      {
        const sw = shockwaves[shockwaves.length - 1]
        if (sw) sw.kind = 'sand'
      }
      break
    case 'tornado':
      spawnLinearTornado(linearTornados, unit, aimAngle)
      break
    case 'obelisk':
      spawnWadjetObeliskBarrage(obeliskBarrages, unit)
      unit.wadjetObeliskCooldown = c.obeliskCooldown
      break
  }
}

export function pickWadjetSkill(unit: BattleUnit, target: BattleUnit, dist: number): WadjetSkillId | null {
  const c = cfg()
  if (dist > c.engageRange + target.radius * 0.35) return null
  if (unit.wadjetObeliskCooldown <= 0) return 'obelisk'
  return unit.wadjetCycleSkill
}

export function startWadjetCast(
  unit: BattleUnit,
  skill: WadjetSkillId,
  target: BattleUnit,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
  linearTornados: LinearSandTornado[],
  obeliskBarrages: ObeliskBarrage[],
  shockwaves: ShockwaveEffect[],
) {
  const c = cfg()
  unit.wadjetPendingSkill = skill
  unit.wadjetCastTimeLeft = c.skillCastDuration
  unit.wadjetSweepStrikesDone = 0
  unit.wadjetCastAimAngle = Math.atan2(target.y - unit.y, target.x - unit.x)
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.attackAnimTimer = c.skillCastDuration
  unit.state = 'attack'

  executeWadjetSkill(
    unit,
    skill,
    units,
    coneStrikes,
    linearTornados,
    obeliskBarrages,
    shockwaves,
  )
}

export function tickWadjetCast(
  unit: BattleUnit,
  dt: number,
  units: BattleUnit[],
  coneStrikes: ConeStrikeEffect[],
  shockwaves: ShockwaveEffect[],
): boolean {
  if (unit.wadjetCastTimeLeft <= 0) return false

  const c = cfg()
  const elapsed = c.skillCastDuration - unit.wadjetCastTimeLeft

  if (unit.wadjetPendingSkill === 'sweep' && unit.wadjetSweepStrikesDone === 1) {
    const secondAt = c.skillCastDuration * 0.5
    if (elapsed >= secondAt && elapsed - dt < secondAt) {
      applySweepDamage(unit, units, unit.wadjetCastAimAngle)
      unit.wadjetSweepStrikesDone = 2
      spawnSweepVisual(coneStrikes, unit, unit.wadjetCastAimAngle)
      spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.sweepConeLength * 0.35, 0.3)
      const sw = shockwaves[shockwaves.length - 1]
      if (sw) sw.kind = 'sand'
    }
  }

  unit.wadjetCastTimeLeft -= dt
  if (unit.wadjetCastTimeLeft > 0) return true

  if (unit.wadjetPendingSkill === 'sweep' || unit.wadjetPendingSkill === 'tornado') {
    unit.wadjetCycleSkill = unit.wadjetPendingSkill === 'sweep' ? 'tornado' : 'sweep'
  }
  unit.wadjetPendingSkill = null
  unit.attackCooldown = c.skillCastDuration
  return false
}

export function tickLinearSandTornados(
  tornados: LinearSandTornado[],
  units: BattleUnit[],
  dt: number,
) {
  for (let i = tornados.length - 1; i >= 0; i--) {
    const t = tornados[i]
    t.x += t.dirX * t.speed * dt
    t.y += t.dirY * t.speed * dt

    const half = t.hitRadius
    if (
      t.x < -half
      || t.x > BATTLE_FIELD.width + half
      || t.y < -half
      || t.y > BATTLE_FIELD.height + half
    ) {
      tornados.splice(i, 1)
      continue
    }

    for (const u of units) {
      if (u.state === 'dead' || u.team === t.team) continue
      if (t.hitEnemyIds.includes(u.id)) continue
      if (Math.hypot(u.x - t.x, u.y - t.y) <= t.hitRadius + u.radius * 0.35) {
        const def = MONSTER_MAP[u.monsterId]
        u.hp -= getDamageAfterArmor(t.damage, u.armor, def.armorToughness ?? 0)
        if (u.hp <= 0) u.state = 'dead'
        t.hitEnemyIds.push(u.id)
      }
    }
  }
}
