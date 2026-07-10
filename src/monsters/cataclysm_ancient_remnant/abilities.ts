import type {
  BattleUnit,
  ConeStrikeEffect,
  FallingObelisk,
  ObeliskBarrage,
  SandTornado,
  ShockwaveEffect,
} from '../../game/types'
import { MONSTER_MAP } from '../monsterMap'
import { getDamageAfterArmor } from '../../game/damage'
import { getRemnantConfig } from './config'
import { applyStatusEffects } from '../../game/statusEffects'
import { eid, spawnShockwave } from '../_shared/combatEffects'

export const REMNANT_ID = 'cataclysm_ancient_remnant'

export type RemnantSkillId = 'bite' | 'tail' | 'sandstorm' | 'stomp' | 'obelisk'

const ALL_SKILLS: RemnantSkillId[] = ['bite', 'tail', 'sandstorm', 'stomp', 'obelisk']
const AIR_SKILLS: RemnantSkillId[] = ['sandstorm', 'obelisk']

function cfg() {
  return getRemnantConfig()
}

export function isAncientRemnant(unit: BattleUnit | string) {
  const id = typeof unit === 'string' ? unit : unit.monsterId
  return id === REMNANT_ID
}

export function initRemnantState(unit: BattleUnit) {
  unit.remnantCastTimeLeft = 0
  unit.remnantPendingSkill = null
  unit.remnantQueuedSkill = null
  unit.remnantObeliskCooldown = 0
}

/** 索敌距离 = 各技能施法距离的最大值 */
export function remnantEngageRange() {
  const c = cfg()
  return Math.max(
    c.biteRange,
    c.tailRadius + c.radius,
    c.stompConeLength + c.radius * 0.5,
    c.sandstormOrbitRadius + c.sandstormHitRadius + c.radius,
    c.obeliskMaxRadius,
  )
}

export function stompHalfAngleRad() {
  return (cfg().stompConeAngleDeg * Math.PI) / 180 / 2
}

/** 锥形方向上的角度偏差（相对指定朝向） */
export function coneAngleOffsetFromAim(aimAngle: number, dx: number, dy: number) {
  const angle = Math.atan2(dy, dx)
  let diff = angle - aimAngle
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return diff
}

/** 锥形方向上的角度偏差（相对面朝方向） */
export function coneAngleOffset(facing: 1 | -1, dx: number, dy: number) {
  return coneAngleOffsetFromAim(facing >= 0 ? 0 : Math.PI, dx, dy)
}

export function coneArcAnglesFromAim(aimAngle: number, halfAngleRad: number) {
  return { start: aimAngle - halfAngleRad, end: aimAngle + halfAngleRad }
}

export function coneArcAngles(facing: 1 | -1, halfAngleRad = stompHalfAngleRad()) {
  if (facing >= 0) return { start: -halfAngleRad, end: halfAngleRad }
  return { start: Math.PI - halfAngleRad, end: Math.PI + halfAngleRad }
}

/** 单位是否落在扇形区域内（释放瞬间伤害判定） */
export function isUnitInStompSector(
  cx: number,
  cy: number,
  aimAngle: number,
  halfAngleRad: number,
  maxRadius: number,
  unit: BattleUnit,
) {
  const dx = unit.x - cx
  const dy = unit.y - cy
  const dist = Math.hypot(dx, dy)
  if (dist <= 0.001) return true

  const angularPad = Math.asin(Math.min(1, unit.radius / dist))
  if (Math.abs(coneAngleOffsetFromAim(aimAngle, dx, dy)) > halfAngleRad + angularPad) {
    return false
  }
  return dist - unit.radius <= maxRadius
}

/** 目标点是否在践踏扇形内（以单位→目标为朝向） */
export function isInStompCone(
  unit: BattleUnit,
  tx: number,
  ty: number,
  length = cfg().stompConeLength,
  halfAngleRad = stompHalfAngleRad(),
) {
  const dx = tx - unit.x
  const dy = ty - unit.y
  const dist = Math.hypot(dx, dy)
  if (dist > length) return false
  if (dist <= 0.001) return true
  const aimAngle = Math.atan2(dy, dx)
  return Math.abs(coneAngleOffsetFromAim(aimAngle, dx, dy)) <= halfAngleRad
}

function waveBandInner(outerReach: number, waveWidth: number) {
  return Math.max(0, outerReach - waveWidth)
}

function skillDamage(base: number, pctMaxHp: number, target: BattleUnit) {
  return base + target.maxHp * (pctMaxHp / 100)
}

function applyDamageTo(
  _attacker: BattleUnit,
  target: BattleUnit,
  rawDamage: number,
) {
  const def = MONSTER_MAP[target.monsterId]
  target.hp -= getDamageAfterArmor(rawDamage, target.armor, def.armorToughness ?? 0)
  if (target.hp <= 0) target.state = 'dead'
  else if (def.onHitEffects.length > 0) applyStatusEffects(target, def.onHitEffects)
}

function hasSandstorm(sourceId: string, tornados: SandTornado[]) {
  return tornados.some((t) => t.sourceId === sourceId && t.remaining > 0)
}

export function isRemnantSkillReady(
  skill: RemnantSkillId,
  unit: BattleUnit,
  tornados: SandTornado[],
): boolean {
  switch (skill) {
    case 'sandstorm':
      return !hasSandstorm(unit.id, tornados)
    case 'obelisk':
      return unit.remnantObeliskCooldown <= 0
    default:
      return true
  }
}

export function isRemnantSkillAllowed(skill: RemnantSkillId, target: BattleUnit) {
  if (target.moveType === 'fly') return AIR_SKILLS.includes(skill)
  return true
}

/** 随机选一个技能（不看距离；对空时仅沙暴/石碑） */
export function rollRemnantSkill(
  unit: BattleUnit,
  target: BattleUnit,
  tornados: SandTornado[],
): RemnantSkillId | null {
  const base = target.moveType === 'fly' ? AIR_SKILLS : ALL_SKILLS
  const pool = base.filter((skill) => isRemnantSkillReady(skill, unit, tornados))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 当前距离与站位是否满足释放条件 */
export function isRemnantSkillInRange(
  skill: RemnantSkillId,
  unit: BattleUnit,
  target: BattleUnit,
  dist: number,
): boolean {
  const c = cfg()
  switch (skill) {
    case 'bite':
      return target.moveType === 'ground' && dist <= c.biteRange + target.radius * 0.35
    case 'tail':
      return target.moveType === 'ground' && dist <= c.tailRadius + target.radius * 0.45
    case 'stomp':
      return target.moveType === 'ground' && isInStompCone(unit, target.x, target.y)
    case 'sandstorm':
      return dist <= c.sandstormOrbitRadius + c.sandstormHitRadius + target.radius
    case 'obelisk':
      return dist <= c.obeliskMaxRadius + target.radius * 0.35
    default:
      return false
  }
}

/** @deprecated 保留兼容；请使用 rollRemnantSkill + isRemnantSkillInRange */
export function canUseRemnantSkill(
  skill: RemnantSkillId,
  unit: BattleUnit,
  target: BattleUnit,
  dist: number,
  tornados: SandTornado[],
): boolean {
  return isRemnantSkillReady(skill, unit, tornados) && isRemnantSkillInRange(skill, unit, target, dist)
}

export function pickRemnantSkill(
  unit: BattleUnit,
  target: BattleUnit | null,
  dist: number,
  tornados: SandTornado[],
): RemnantSkillId | null {
  if (!target || target.state === 'dead') return null
  const skill = unit.remnantQueuedSkill ?? rollRemnantSkill(unit, target, tornados)
  if (!skill) return null
  if (!isRemnantSkillInRange(skill, unit, target, dist)) return null
  return skill
}

export function startRemnantCast(
  unit: BattleUnit,
  skill: RemnantSkillId,
  target: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
  tornados: SandTornado[],
  obeliskBarrages: ObeliskBarrage[],
  fallingObelisks: FallingObelisk[],
  coneStrikes: ConeStrikeEffect[],
) {
  const c = cfg()
  const duration = c.skillCastDuration
  unit.remnantPendingSkill = skill
  unit.remnantQueuedSkill = null
  unit.remnantCastTimeLeft = duration
  unit.attackAnimTimer = duration
  unit.attackCooldown = c.attackInterval
  unit.facing = target.x >= unit.x ? 1 : -1
  unit.state = 'attack'

  executeRemnantSkill(
    unit,
    skill,
    target,
    units,
    shockwaves,
    tornados,
    obeliskBarrages,
    fallingObelisks,
    coneStrikes,
  )
}

function applyStompSectorDamage(attacker: BattleUnit, units: BattleUnit[], aimAngle: number) {
  const c = cfg()
  const halfRad = stompHalfAngleRad()
  const maxRadius = c.stompConeLength
  for (const u of units) {
    if (u.state === 'dead' || u.team === attacker.team || u.moveType !== 'ground') continue
    if (isUnitInStompSector(attacker.x, attacker.y, aimAngle, halfRad, maxRadius, u)) {
      applyDamageTo(attacker, u, skillDamage(c.stompBase, c.stompPctMaxHp, u))
    }
  }
}

export function spawnStompWaveVisual(cones: ConeStrikeEffect[], unit: BattleUnit, aimAngle: number) {
  const c = cfg()
  const duration = c.skillCastDuration
  const startReach = c.stompWaveWidth
  cones.push({
    id: eid(),
    team: unit.team,
    x: unit.x,
    y: unit.y,
    aimAngle,
    maxLength: c.stompConeLength,
    angleDeg: c.stompConeAngleDeg,
    waveWidth: c.stompWaveWidth,
    startReach,
    reach: startReach,
    remaining: duration,
    duration,
    kind: 'wave',
  })
}

export function stompWaveProgress(cone: ConeStrikeEffect) {
  if (cone.duration <= 0) return 1
  return Math.min(1, Math.max(0, 1 - cone.remaining / cone.duration))
}

export function stompWaveOuterReach(cone: ConeStrikeEffect) {
  return cone.startReach + (cone.maxLength - cone.startReach) * stompWaveProgress(cone)
}

/** 海浪波带几何（渲染与伤害判定共用） */
export function getStompWaveBandGeom(cone: ConeStrikeEffect) {
  const outerReach = cone.reach
  const innerReach = waveBandInner(outerReach, cone.waveWidth)
  const halfRad = (cone.angleDeg * Math.PI) / 360
  const aimAngle = cone.aimAngle
  return {
    cx: cone.x,
    cy: cone.y,
    aimAngle,
    halfRad,
    outerReach,
    innerReach,
    waveWidth: cone.waveWidth,
    start: aimAngle - halfRad,
    end: aimAngle + halfRad,
  }
}

/** 海浪动画 tick（纯视觉，不造成伤害） */
export function tickConeStrikes(cones: ConeStrikeEffect[], dt: number) {
  for (let i = cones.length - 1; i >= 0; i--) {
    const cone = cones[i]
    cone.remaining -= dt
    if (cone.kind !== 'instant') {
      cone.reach = stompWaveOuterReach(cone)
    }
    if (cone.remaining <= 0) cones.splice(i, 1)
  }
}

export function tickRemnantCast(
  unit: BattleUnit,
  dt: number,
): boolean {
  if (unit.remnantCastTimeLeft <= 0) return false
  unit.remnantCastTimeLeft -= dt
  if (unit.remnantCastTimeLeft > 0) return true

  unit.remnantPendingSkill = null
  return false
}

function executeRemnantSkill(
  unit: BattleUnit,
  skill: RemnantSkillId,
  target: BattleUnit | null,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
  tornados: SandTornado[],
  obeliskBarrages: ObeliskBarrage[],
  _fallingObelisks: FallingObelisk[],
  coneStrikes: ConeStrikeEffect[],
) {
  const c = cfg()
  switch (skill) {
    case 'bite':
      if (target && target.state !== 'dead' && target.moveType === 'ground') {
        const dist = Math.hypot(target.x - unit.x, target.y - unit.y)
        if (dist <= c.biteRange + target.radius * 0.35) {
          applyDamageTo(unit, target, skillDamage(c.biteBase, c.bitePctMaxHp, target))
        }
      }
      break
    case 'tail': {
      for (const u of units) {
        if (u.state === 'dead' || u.team === unit.team || u.moveType !== 'ground') continue
        if (Math.hypot(u.x - unit.x, u.y - unit.y) <= c.tailRadius + u.radius * 0.45) {
          applyDamageTo(unit, u, skillDamage(c.tailBase, c.tailPctMaxHp, u))
        }
      }
      spawnShockwave(shockwaves, unit.team, unit.x, unit.y, c.tailRadius, 0.45)
      const sw = shockwaves[shockwaves.length - 1]
      if (sw) sw.kind = 'sand'
      break
    }
    case 'sandstorm': {
      for (let i = 0; i < c.sandstormCount; i++) {
        tornados.push({
          id: eid(),
          team: unit.team,
          sourceId: unit.id,
          orbitIndex: i,
          orbitRadius: c.sandstormOrbitRadius,
          angle: (Math.PI * 2 * i) / c.sandstormCount,
          angularSpeed: c.sandstormAngularSpeed,
          hitRadius: c.sandstormHitRadius,
          damage: c.sandstormDamage,
          remaining: c.sandstormDuration,
          hitCooldowns: {},
        })
      }
      break
    }
    case 'stomp': {
      const aimAngle = target
        ? Math.atan2(target.y - unit.y, target.x - unit.x)
        : unit.facing >= 0 ? 0 : Math.PI
      applyStompSectorDamage(unit, units, aimAngle)
      spawnStompWaveVisual(coneStrikes, unit, aimAngle)
      spawnShockwave(shockwaves, unit.team, unit.x, unit.y, cfg().stompConeLength * 0.45, 0.35)
      const sw = shockwaves[shockwaves.length - 1]
      if (sw) sw.kind = 'sand'
      break
    }
    case 'obelisk':
      spawnObeliskBarrage(obeliskBarrages, unit)
      unit.remnantObeliskCooldown = c.obeliskCooldown
      break
  }
}

function spawnObeliskBarrage(barrages: ObeliskBarrage[], unit: BattleUnit) {
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
    baseDamage: c.obeliskBase,
    pctMaxHp: c.obeliskPctMaxHp,
    hitEnemyIds: [],
    ringInterval: c.obeliskRingInterval,
    fallDuration: c.obeliskFallDuration,
    impactRadius: c.obeliskImpactRadius,
    spacing: c.obeliskSpacing,
  })
}

function spawnObeliskRing(
  barrage: ObeliskBarrage,
  ringIndex: number,
  falling: FallingObelisk[],
) {
  const { cx, cy, maxRadius, ringCount, fallDuration, impactRadius, spacing } = barrage
  // 落点弧长间距须大于伤害直径，石碑圈之间才有躲避间隙
  const stoneSpacing = Math.max(spacing, impactRadius * 2.35)

  const pushStone = (x: number, y: number) => {
    falling.push({
      id: eid(),
      team: barrage.team,
      sourceId: barrage.sourceId,
      barrageId: barrage.id,
      x,
      y,
      fallProgress: 0,
      duration: fallDuration,
      impactRadius,
      landed: false,
      linger: 0.35,
    })
  }

  if (ringIndex === 0) {
    pushStone(cx, cy)
    return
  }

  const ringRadius = (maxRadius * ringIndex) / (ringCount - 1)
  const count = Math.max(4, Math.round((Math.PI * 2 * ringRadius) / stoneSpacing))
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + ringIndex * 0.18
    pushStone(cx + Math.cos(angle) * ringRadius, cy + Math.sin(angle) * ringRadius)
  }
}

function applyObeliskImpact(
  barrage: ObeliskBarrage,
  stone: FallingObelisk,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
) {
  const attacker = units.find((u) => u.id === barrage.sourceId && u.state !== 'dead')
  if (!attacker) return

  for (const u of units) {
    if (u.state === 'dead' || u.team === barrage.team) continue
    if (barrage.hitEnemyIds.includes(u.id)) continue
    if (Math.hypot(u.x - stone.x, u.y - stone.y) <= stone.impactRadius + u.radius * 0.25) {
      applyDamageTo(attacker, u, skillDamage(barrage.baseDamage, barrage.pctMaxHp, u))
      barrage.hitEnemyIds.push(u.id)
    }
  }

  spawnShockwave(shockwaves, barrage.team, stone.x, stone.y, stone.impactRadius * 0.85, 0.32)
  const sw = shockwaves[shockwaves.length - 1]
  if (sw) sw.kind = 'sand'
}

export function tickObeliskBarrages(
  barrages: ObeliskBarrage[],
  falling: FallingObelisk[],
  dt: number,
) {
  for (let i = barrages.length - 1; i >= 0; i--) {
    const b = barrages[i]
    if (b.nextRingIndex >= b.ringCount) {
      const hasStones = falling.some((s) => s.barrageId === b.id)
      if (!hasStones) barrages.splice(i, 1)
      continue
    }

    b.ringTimer -= dt
    if (b.ringTimer > 0) continue

    spawnObeliskRing(b, b.nextRingIndex, falling)
    b.nextRingIndex += 1
    b.ringTimer = b.nextRingIndex < b.ringCount ? b.ringInterval : 0
  }
}

export function tickFallingObelisks(
  falling: FallingObelisk[],
  barrages: ObeliskBarrage[],
  units: BattleUnit[],
  dt: number,
  shockwaves: ShockwaveEffect[],
) {
  for (let i = falling.length - 1; i >= 0; i--) {
    const stone = falling[i]
    const barrage = barrages.find((b) => b.id === stone.barrageId)

    if (!stone.landed) {
      stone.fallProgress += dt / stone.duration
      if (stone.fallProgress >= 1) {
        stone.fallProgress = 1
        stone.landed = true
        if (barrage) applyObeliskImpact(barrage, stone, units, shockwaves)
      }
      continue
    }

    stone.linger -= dt
    if (stone.linger <= 0) falling.splice(i, 1)
  }
}

export function tickSandTornados(
  tornados: SandTornado[],
  units: BattleUnit[],
  dt: number,
) {
  const c = cfg()
  for (let i = tornados.length - 1; i >= 0; i--) {
    const t = tornados[i]
    t.remaining -= dt
    if (t.remaining <= 0) {
      tornados.splice(i, 1)
      continue
    }

    const source = units.find((u) => u.id === t.sourceId && u.state !== 'dead')
    if (!source) {
      tornados.splice(i, 1)
      continue
    }

    t.angle += t.angularSpeed * dt
    const tx = source.x + Math.cos(t.angle) * t.orbitRadius
    const ty = source.y + Math.sin(t.angle) * t.orbitRadius

    for (const key of Object.keys(t.hitCooldowns)) {
      t.hitCooldowns[key] -= dt
      if (t.hitCooldowns[key] <= 0) delete t.hitCooldowns[key]
    }

    for (const u of units) {
      if (u.state === 'dead' || u.team === t.team) continue
      if (t.hitCooldowns[u.id] && t.hitCooldowns[u.id] > 0) continue
      if (Math.hypot(u.x - tx, u.y - ty) <= t.hitRadius + u.radius * 0.35) {
        u.hp -= getDamageAfterArmor(
          t.damage,
          u.armor,
          MONSTER_MAP[u.monsterId].armorToughness ?? 0,
        )
        if (u.hp <= 0) u.state = 'dead'
        t.hitCooldowns[u.id] = c.sandstormHitCooldown
      }
    }
  }
}

export function getTornadoPosition(t: SandTornado, units: BattleUnit[]) {
  const source = units.find((u) => u.id === t.sourceId)
  if (!source) return { x: 0, y: 0 }
  return {
    x: source.x + Math.cos(t.angle) * t.orbitRadius,
    y: source.y + Math.sin(t.angle) * t.orbitRadius,
  }
}
