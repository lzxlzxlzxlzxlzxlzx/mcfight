import type { ActiveBeam, BattleSnapshot, BattleUnit, DeployedUnit, MonsterDef, Projectile, ShockwaveEffect } from './types'
import { MONSTER_MAP } from '../data/monsters'
import {
  applyStatusEffects,
  FLY_MELEE_VULN_WINDOW,
  isFeared,
  tickStatusEffects,
} from './statusEffects'
import {
  aoeDamageAtCenter,
  eid,
  isChannelingBeam,
  spawnShockwave,
  updateActiveBeams,
  updateShockwaves,
} from './abilities/combatEffects'
import {
  getTremorAoeDamage,
  getTremorAoeRadius,
  getTremorBeam,
} from './abilities/tremorzilla'
import {
  initLuxState,
  luxEngageRange,
  luxStomp,
  luxTailSwipe,
  shouldLeap,
  startLeap,
  tickLeap,
  tickLava,
  tickLuxMeteorPassive,
  tickMeteors,
} from './abilities/luxtructosaurus'
import {
  initRemnantState,
  isRemnantSkillAllowed,
  isRemnantSkillInRange,
  isRemnantSkillReady,
  rollRemnantSkill,
  remnantEngageRange,
  startRemnantCast,
  tickObeliskBarrages,
  tickFallingObelisks,
  tickRemnantCast,
  tickSandTornados,
  tickConeStrikes,
} from './abilities/ancientRemnant'
import {
  harbingerEngageRange,
  harbingerNormalAttack,
  initHarbingerState,
  isHarbingerBusy,
  isHarbingerChanneling,
  tickHarbingerCharge,
  tickHarbingerDeathBeams,
  tickHarbingerPassive,
  tickHarbingerProjectiles,
  tryCastHarbingerSkill,
} from './abilities/harbinger'
import {
  getWardenConfig,
  initWardenState,
  wardenEngageRange,
  wardenMeleeAttack,
  wardenRangedAttack,
} from './abilities/warden'
import {
  initWadjetState,
  isWadjetSkillInRange,
  pickWadjetSkill,
  startWadjetCast,
  tickLinearSandTornados,
  tickWadjetCast,
  wadjetEngageRange,
} from './abilities/wadjet'
import {
  initKobolediatorState,
  isKoboSkillInRange,
  kobolediatorEngageRange,
  pickKobolediatorSkill,
  startKoboCast,
  startKoboCharge,
  tickKoboCast,
  tickKoboCharge,
} from './abilities/kobolediator'
import {
  getAtlantitanAoeDamage,
  getAtlantitanAoeRadius,
} from '../monsters/alexscaves_atlatitan/abilities'
import {
  initTremorsaurusState,
  tickTremorsaurusRoar,
} from '../monsters/alexscaves_tremorsaurus/abilities'
import {
  enderGolemEngageRange,
  executeEnderGolemSkill,
  isEnderSkillInRange,
  pickEnderGolemSkill,
  tickEnderGolemCast,
  tickVoidRuneEffects,
} from '../monsters/cataclysm_ender_golem/abilities'
import {
  executeMoscoGroundSkill,
  initWarpedMoscoState,
  isMoscoInFrenzy,
  isMoscoSkillInRange,
  moscoEngageRange,
  pickMoscoSkill,
  tickMoscoCast,
  tryTransformWarpedMosco,
} from '../monsters/alexsmobs_warped_mosco/abilities'
import {
  canCyclopsTargetEnemy,
  cyclopsEngageRange,
  executeCyclopsDevour,
  executeCyclopsSlam,
  initCyclopsState,
  isCyclopsActionInRange,
  pickCyclopsAction,
} from '../monsters/iceandfire_cyclops/abilities'
import {
  amethystCrabEngageRange,
  hasEnemyInEmergeRange,
  initAmethystCrabState,
  isAmethystCrabBusy,
  startAmethystCrabBurrow,
  tickAmethystCrab,
} from '../monsters/cataclysm_amethyst_crab/abilities'
import {
  initRevenantState,
  isRevenantBusy,
  pickRevenantSkill,
  revenantEngageRange,
  startRevenantCast,
  tickRevenantCast,
} from '../monsters/cataclysm_ignited_revenant/abilities'
import { tickStraightProjectiles, tickPiercingProjectiles } from '../monsters/_shared/projectiles'
import {
  canCoralLeapAttack,
  coralLeapEngageRange,
  initCoralLeapState,
  startCoralLeap,
  tickCoralLeap,
} from '../monsters/_shared/coralLeap'
import {
  forsakenEngageRange,
  initForsakenState,
  isForsakenBusy,
  pickForsakenSkill,
  shouldForsakenApproachLeap,
  startForsakenApproachLeap,
  startForsakenCast,
  tickForsakenApproachLeap,
  tickForsakenCast,
  tickForsakenArcWaves,
  tickForsakenRegen,
} from '../monsters/alexscaves_forsaken/abilities'
import { getLuxConfig } from './monsterConfig'
import { dealDamageToUnit } from './unitDamage'

import { BATTLE_FIELD, clampUnitToField } from './field'
import { initUnitDrift, tickUnitDrift } from './unitDrift'
import { isWithinCastRange, TARGET_RETARGET_INTERVAL } from './unitCombat'
const TICK_DT = 1 / 30
const STICKY_RANGE_BONUS = 30
const SEPARATION_FORCE = 120

let nextId = 1
const uid = () => `u-${nextId++}`
const pid = () => `p-${nextId++}`

function distance(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx
  const dy = ay - by
  return Math.hypot(dx, dy)
}

function calcDamage(attack: number, target: BattleUnit, category: 'melee' | 'ranged' | 'beam' | 'explosion' = 'melee') {
  return dealDamageToUnit(target, attack, category)
}

function createBattleUnit(deployed: DeployedUnit, def: MonsterDef): BattleUnit {
  const unit: BattleUnit = {
    id: deployed.id,
    monsterId: deployed.monsterId,
    team: deployed.team,
    x: deployed.x,
    y: deployed.y,
    hp: def.hp,
    maxHp: def.hp,
    attack: def.attack,
    armor: def.armor,
    moveType: def.moveType,
    attackType: def.attackType,
    attackRange: def.attackRange,
    moveSpeed: def.moveSpeed,
    attackInterval: def.attackInterval,
    radius: def.radius,
    attackCooldown: 0,
    targetId: null,
    state: 'idle',
    facing: deployed.team === 0 ? 1 : -1,
    attackAnimTimer: 0,
    statusEffects: [],
    vulnerableWindow: 0,
    baseMoveSpeed: def.moveSpeed,
    baseAttackInterval: def.attackInterval,
    skillCooldown: 0,
    luxNextStomp: false,
    meteorTimer: getLuxConfig().meteorInterval,
    leapTimeLeft: 0,
    leapCooldown: 0,
    leapFromX: 0,
    leapFromY: 0,
    leapToX: 0,
    leapToY: 0,
    remnantCastTimeLeft: 0,
    remnantPendingSkill: null,
    remnantQueuedSkill: null,
    remnantObeliskCooldown: 0,
    harbRegenAccum: 0,
    harbAttackMode: 'wither_missile',
    harbModeTimer: 0,
    harbSkillTimer: 0,
    harbSkillIndex: 0,
    harbChargeTimeLeft: 0,
    harbChargeFromX: 0,
    harbChargeFromY: 0,
    harbChargeToX: 0,
    harbChargeToY: 0,
    harbChargeHits: {},
    driftAngle: 0,
    driftTimer: 0,
    retargetTimer: Math.random() * TARGET_RETARGET_INTERVAL,
    wadjetCastTimeLeft: 0,
    wadjetPendingSkill: null,
    wadjetCycleSkill: 'sweep',
    wadjetObeliskCooldown: 0,
    wadjetSweepStrikesDone: 0,
    wadjetCastAimAngle: 0,
    koboCastTimeLeft: 0,
    koboPendingSkill: null,
    koboCycleSkill: 'triple',
    koboChargeTimeLeft: 0,
    koboChargeFromX: 0,
    koboChargeFromY: 0,
    koboChargeToX: 0,
    koboChargeToY: 0,
    koboTripleStrikesDone: 0,
    koboCastAimAngle: 0,
    enderCastTimeLeft: 0,
    tremorRoarCooldown: 0,
    tremorRoarTimeLeft: 0,
    moscoPhase: 'ground',
    moscoCastTimeLeft: 0,
    crabBurrowTimeLeft: 0,
    crabCastTimeLeft: 0,
    crabPendingSkill: null,
    revenantCastTimeLeft: 0,
    revenantPendingSkill: null,
    revenantTicksDone: 0,
    revenantAimAngle: 0,
    revenantAttackCooldown: 0,
    forsakenRegenAccum: 0,
    forsakenCastTimeLeft: 0,
    forsakenPendingSkill: null,
    forsakenTicksDone: 0,
    forsakenAimAngle: 0,
    forsakenLeapCooldown: 0,
  }
  initUnitDrift(unit)
  if (def.tags.includes('lux_boss')) initLuxState(unit)
  if (def.tags.includes('remnant_boss')) initRemnantState(unit)
  if (def.tags.includes('harbinger_boss')) initHarbingerState(unit)
  if (def.tags.includes('warden_special')) initWardenState(unit)
  if (def.tags.includes('wadjet_boss')) initWadjetState(unit)
  if (def.tags.includes('kobo_boss')) initKobolediatorState(unit)
  if (def.tags.includes('tremorsaurus_special')) initTremorsaurusState(unit)
  if (def.tags.includes('mosco_special')) initWarpedMoscoState(unit)
  if (def.tags.includes('cyclops_special')) initCyclopsState(unit)
  if (def.tags.includes('amethyst_crab_special')) initAmethystCrabState(unit)
  if (def.tags.includes('revenant_special')) initRevenantState(unit)
  if (def.tags.includes('coral_leap_special')) initCoralLeapState(unit)
  if (def.tags.includes('forsaken_special')) initForsakenState(unit)
  clampPosition(unit)
  return unit
}

function enemiesOf(unit: BattleUnit, units: BattleUnit[]) {
  return units.filter((u) => u.team !== unit.team && u.state !== 'dead')
}

function canTargetForAttack(attacker: BattleUnit, target: BattleUnit, allowBeamAntiAir: boolean) {
  if (allowBeamAntiAir) return true
  if (attacker.attackType === 'ranged') return true
  if (target.moveType === 'ground') return true
  if (attacker.moveType === 'fly') return true
  return target.vulnerableWindow > 0
}

function engageRange(unit: BattleUnit): number {
  const def = MONSTER_MAP[unit.monsterId]
  if (def.tags.includes('beam_skill')) return Math.max(unit.attackRange, getTremorBeam().castRange)
  if (def.tags.includes('lux_boss')) return luxEngageRange()
  if (def.tags.includes('remnant_boss')) return remnantEngageRange()
  if (def.tags.includes('harbinger_boss')) return harbingerEngageRange()
  if (def.tags.includes('warden_special')) return wardenEngageRange()
  if (def.tags.includes('wadjet_boss')) return wadjetEngageRange()
  if (def.tags.includes('kobo_boss')) return kobolediatorEngageRange()
  if (def.tags.includes('ender_golem_boss')) return enderGolemEngageRange()
  if (def.tags.includes('mosco_special')) return moscoEngageRange(unit)
  if (def.tags.includes('cyclops_special')) return cyclopsEngageRange()
  if (def.tags.includes('amethyst_crab_special')) return amethystCrabEngageRange()
  if (def.tags.includes('revenant_special')) return revenantEngageRange()
  if (def.tags.includes('coral_leap_special')) return coralLeapEngageRange(unit)
  if (def.tags.includes('forsaken_special')) return forsakenEngageRange()
  return unit.attackRange
}

function canPickEnemy(
  attacker: BattleUnit,
  enemy: BattleUnit,
  allowAntiAir: boolean,
  def: MonsterDef,
): boolean {
  if (def.tags.includes('cyclops_special')) {
    return canCyclopsTargetEnemy(enemy)
  }
  if (def.tags.includes('forsaken_special')) {
    return true
  }
  return canTargetForAttack(attacker, enemy, allowAntiAir)
}

function pickNearestTarget(
  unit: BattleUnit,
  enemies: BattleUnit[],
  allowAntiAir: boolean,
  def: MonsterDef,
): BattleUnit | null {
  let best: BattleUnit | null = null
  let bestScore = Infinity
  for (const enemy of enemies) {
    if (!canPickEnemy(unit, enemy, allowAntiAir, def)) continue
    let score = distance(unit.x, unit.y, enemy.x, enemy.y)
    if (def.tags.includes('anti_arthropod') && enemy.moveType === 'fly') score *= 0.75
    if (score < bestScore) {
      bestScore = score
      best = enemy
    }
  }
  return best
}

function pickTarget(unit: BattleUnit, units: BattleUnit[], forceRetarget = false): BattleUnit | null {
  const enemies = enemiesOf(unit, units)
  if (enemies.length === 0) return null
  const range = engageRange(unit)
  const def = MONSTER_MAP[unit.monsterId]
  const allowBeamAntiAir = def.tags.includes('beam_skill') && unit.skillCooldown <= 0
  const allowWadjetAntiAir = def.tags.includes('wadjet_boss')
  const allowWardenTarget = def.tags.includes('warden_special')
  const allowMoscoAntiAir = def.tags.includes('mosco_special') && unit.moscoPhase === 'frenzy'
  const allowAntiAir = allowBeamAntiAir || allowWadjetAntiAir || allowWardenTarget || allowMoscoAntiAir

  if (!forceRetarget && unit.targetId) {
    const current = enemies.find((e) => e.id === unit.targetId)
    if (current && canPickEnemy(unit, current, allowAntiAir, def)) {
      const dist = distance(unit.x, unit.y, current.x, current.y)
      if (dist <= range + STICKY_RANGE_BONUS) return current
    }
  }

  return pickNearestTarget(unit, enemies, allowAntiAir, def)
}

function separate(unit: BattleUnit, allies: BattleUnit[], dt: number) {
  let sx = 0
  let sy = 0
  for (const ally of allies) {
    if (ally.id === unit.id || ally.state === 'dead') continue
    const d = distance(unit.x, unit.y, ally.x, ally.y)
    const minDist = unit.radius + ally.radius
    if (d > 0 && d < minDist) {
      const push = (minDist - d) / minDist
      sx += ((unit.x - ally.x) / d) * push
      sy += ((unit.y - ally.y) / d) * push
    }
  }
  unit.x += sx * SEPARATION_FORCE * dt
  unit.y += sy * SEPARATION_FORCE * dt
  clampPosition(unit)
}

function clampPosition(unit: BattleUnit) {
  const def = MONSTER_MAP[unit.monsterId]
  clampUnitToField(unit, def?.tags ?? [])
}

/** 追击目标：不在施法/攻击范围内时统一先接近 */
function chaseTowardTarget(
  unit: BattleUnit,
  target: BattleUnit,
  allies: BattleUnit[],
  speedMul = 1,
) {
  unit.state = 'chase'
  const dx = target.x - unit.x
  const dy = target.y - unit.y
  const len = Math.hypot(dx, dy) || 1
  unit.x += (dx / len) * unit.moveSpeed * speedMul * TICK_DT
  unit.y += (dy / len) * unit.moveSpeed * speedMul * TICK_DT
  separate(unit, allies, TICK_DT)
  clampPosition(unit)
}

/** 无有效目标时在场内随机游荡 */
function idleWander(unit: BattleUnit, allies: BattleUnit[], tags: readonly string[]) {
  unit.state = 'idle'
  tickUnitDrift(unit, TICK_DT, tags, 0.72, BATTLE_FIELD)
  separate(unit, allies, TICK_DT)
  clampPosition(unit)
}

function canDriftDuringInterval(unit: BattleUnit, activeBeams: ActiveBeam[]): boolean {
  if (unit.leapTimeLeft > 0) return false
  if (unit.remnantCastTimeLeft > 0) return false
  if (unit.wadjetCastTimeLeft > 0) return false
  if (unit.koboCastTimeLeft > 0) return false
  if (unit.koboChargeTimeLeft > 0) return false
  if (unit.harbChargeTimeLeft > 0) return false
  if (unit.enderCastTimeLeft > 0) return false
  if (unit.moscoCastTimeLeft > 0) return false
  if (unit.crabBurrowTimeLeft > 0 || unit.crabCastTimeLeft > 0) return false
  if (unit.revenantCastTimeLeft > 0) return false
  if (unit.forsakenCastTimeLeft > 0) return false
  if (unit.attackAnimTimer > 0) return false
  if (isChannelingBeam(unit.id, activeBeams)) return false
  if (isHarbingerChanneling(unit.id, activeBeams)) return false
  return true
}

function applyAttackIntervalDrift(
  unit: BattleUnit,
  allies: BattleUnit[],
  tags: readonly string[],
  inAttackRange: boolean,
  activeBeams: ActiveBeam[],
  options?: { always?: boolean; speedMul?: number },
) {
  const always = options?.always ?? false
  if (!canDriftDuringInterval(unit, activeBeams)) return
  if (!always && (!inAttackRange || unit.attackCooldown <= 0)) return
  if (always && isHarbingerBusy(unit, activeBeams)) return

  tickUnitDrift(unit, TICK_DT, tags, options?.speedMul ?? 0.72, BATTLE_FIELD)
  separate(unit, allies, TICK_DT)
  clampPosition(unit)
}

/** @deprecated 使用 clampUnitToField */
export function clampBattleUnit(unit: BattleUnit) {
  clampPosition(unit)
}

function onAttackHit(attacker: BattleUnit, target: BattleUnit) {
  const def = MONSTER_MAP[attacker.monsterId]
  if (attacker.moveType === 'fly' && attacker.attackType === 'melee') {
    attacker.vulnerableWindow = FLY_MELEE_VULN_WINDOW
  }
  if (target.state === 'dead') return
  if (def.onHitEffects.length > 0) applyStatusEffects(target, def.onHitEffects)
}

function applyExplosion(source: BattleUnit, units: BattleUnit[], rawDamage: number, radius = 90) {
  const def = MONSTER_MAP[source.monsterId]
  for (const u of units) {
    if (u.state === 'dead') continue
    if (distance(source.x, source.y, u.x, u.y) <= radius) {
      u.hp -= calcDamage(rawDamage, u, 'explosion')
      if (u.hp <= 0) u.state = 'dead'
      else if (def.onHitEffects.length > 0) applyStatusEffects(u, def.onHitEffects)
    }
  }
}

function meleeAttack(attacker: BattleUnit, target: BattleUnit) {
  target.hp -= calcDamage(attacker.attack, target)
  attacker.attackAnimTimer = 0.25
  if (target.hp <= 0) target.state = 'dead'
  onAttackHit(attacker, target)
}

function resolveAoeMeleeParams(attacker: BattleUnit) {
  if (attacker.monsterId === 'alexscaves_tremorzilla') {
    return { radius: getTremorAoeRadius(), damage: getTremorAoeDamage() }
  }
  if (attacker.monsterId === 'alexscaves_atlatitan') {
    return { radius: getAtlantitanAoeRadius(), damage: getAtlantitanAoeDamage() }
  }
  return { radius: 64, damage: attacker.attack }
}

function aoeMeleeAttack(
  attacker: BattleUnit,
  target: BattleUnit,
  units: BattleUnit[],
  shockwaves: ShockwaveEffect[],
) {
  const { radius, damage } = resolveAoeMeleeParams(attacker)
  aoeDamageAtCenter(attacker, target.x, target.y, radius, units, damage)
  spawnShockwave(shockwaves, attacker.team, target.x, target.y, radius)
  attacker.attackAnimTimer = 0.4
  if (attacker.moveType === 'fly' && attacker.attackType === 'melee') {
    attacker.vulnerableWindow = FLY_MELEE_VULN_WINDOW
  }
}

function fireSuperBeam(
  attacker: BattleUnit,
  target: BattleUnit,
  beams: ActiveBeam[],
) {
  const dx = target.x - attacker.x
  const dy = target.y - attacker.y
  const len = Math.hypot(dx, dy) || 1
  attacker.facing = dx >= 0 ? 1 : -1
  const beam = getTremorBeam()
  beams.push({
    id: eid(),
    team: attacker.team,
    sourceId: attacker.id,
    targetId: target.id,
    originX: attacker.x,
    originY: attacker.y,
    dirX: dx / len,
    dirY: dy / len,
    length: beam.range,
    halfWidth: beam.halfWidth,
    remaining: beam.duration,
    tickAccumulator: 0,
    ticksRemaining: beam.ticks,
    damagePerTick: beam.damagePerTick,
    sourceMonsterId: attacker.monsterId,
    kind: 'tremor',
  })
  attacker.skillCooldown = beam.cooldown
  attacker.attackAnimTimer = beam.duration
  attacker.state = 'attack'
}

function spawnProjectile(
  attacker: BattleUnit,
  target: BattleUnit,
  projectiles: Projectile[],
) {
  const dx = target.x - attacker.x
  const dy = target.y - attacker.y
  const dist = Math.hypot(dx, dy) || 1
  projectiles.push({
    id: pid(),
    team: attacker.team,
    x: attacker.x,
    y: attacker.y,
    targetId: target.id,
    speed: 280,
    rawDamage: attacker.attack,
    sourceId: attacker.id,
    sourceMonsterId: attacker.monsterId,
    dirX: dx / dist,
    dirY: dy / dist,
    maxTravel: attacker.attackRange * 1.15,
    traveled: 0,
  })
  attacker.attackAnimTimer = 0.25
}

function updateProjectiles(projectiles: Projectile[], units: BattleUnit[]) {
  tickStraightProjectiles(projectiles, units, TICK_DT, new Set(['default', 'revenant_bone']))
  tickPiercingProjectiles(projectiles, units, TICK_DT, new Set())
}

function checkWinner(units: BattleUnit[]): 0 | 1 | null {
  const alive0 = units.some((u) => u.team === 0 && u.state !== 'dead')
  const alive1 = units.some((u) => u.team === 1 && u.state !== 'dead')
  if (alive0 && alive1) return null
  if (alive0) return 0
  if (alive1) return 1
  return null
}

export function createBattleFromDeployments(deployed: DeployedUnit[]): BattleSnapshot {
  nextId = 1
  const units = deployed.map((d) => {
    const def = MONSTER_MAP[d.monsterId]
    const unit = createBattleUnit({ ...d, id: uid() }, def)
    clampUnitToField(unit, def.tags)
    return unit
  })
  return { units, projectiles: [], shockwaves: [], activeBeams: [], meteors: [], lavaPatches: [], sandTornados: [], obeliskBarrages: [], fallingObelisks: [], coneStrikes: [], linearSandTornados: [], forsakenArcWaves: [], voidRunes: [], tick: 0, winner: null }
}

export function stepBattle(snapshot: BattleSnapshot): BattleSnapshot {
  if (snapshot.winner !== null) return snapshot

  const units = snapshot.units.map((u) => ({
    ...u,
    statusEffects: u.statusEffects.map((e) => ({ ...e })),
    harbChargeHits: { ...u.harbChargeHits },
  }))
  const projectiles = snapshot.projectiles.map((p) => ({ ...p }))
  const shockwaves = snapshot.shockwaves.map((s) => ({ ...s }))
  const activeBeams = snapshot.activeBeams.map((b) => ({ ...b }))
  const meteors = snapshot.meteors.map((m) => ({ ...m }))
  const lavaPatches = snapshot.lavaPatches.map((l) => ({ ...l }))
  const sandTornados = snapshot.sandTornados.map((t) => ({
    ...t,
    hitCooldowns: { ...t.hitCooldowns },
  }))
  const obeliskBarrages = snapshot.obeliskBarrages.map((b) => ({
    ...b,
    hitEnemyIds: [...b.hitEnemyIds],
  }))
  const fallingObelisks = snapshot.fallingObelisks.map((s) => ({ ...s }))
  const coneStrikes = snapshot.coneStrikes.map((c) => ({ ...c }))
  const linearSandTornados = snapshot.linearSandTornados.map((t) => ({
    ...t,
    hitEnemyIds: [...t.hitEnemyIds],
  }))
  const forsakenArcWaves = (snapshot.forsakenArcWaves ?? []).map((w) => ({
    ...w,
    hitEnemyIds: [...w.hitEnemyIds],
  }))
  const voidRunes = snapshot.voidRunes.map((v) => ({ ...v }))

  updateShockwaves(shockwaves, TICK_DT)
  updateActiveBeams(activeBeams, units, TICK_DT)
  tickHarbingerDeathBeams(activeBeams, units, TICK_DT)
  tickMeteors(meteors, TICK_DT, units, shockwaves, lavaPatches)
  tickLava(lavaPatches, units, TICK_DT)
  tickSandTornados(sandTornados, units, TICK_DT)
  tickLinearSandTornados(linearSandTornados, units, TICK_DT)
  tickForsakenArcWaves(forsakenArcWaves, units, TICK_DT)
  tickVoidRuneEffects(voidRunes, TICK_DT)
  tickObeliskBarrages(obeliskBarrages, fallingObelisks, TICK_DT)
  tickFallingObelisks(fallingObelisks, obeliskBarrages, units, TICK_DT, shockwaves)

  for (const unit of units) {
    if (unit.state === 'dead') continue
    tickStatusEffects(unit, units, TICK_DT)
    if (unit.hp <= 0) continue

    unit.attackCooldown = Math.max(0, unit.attackCooldown - TICK_DT)
    unit.skillCooldown = Math.max(0, unit.skillCooldown - TICK_DT)
    unit.leapCooldown = Math.max(0, unit.leapCooldown - TICK_DT)
    unit.remnantObeliskCooldown = Math.max(0, unit.remnantObeliskCooldown - TICK_DT)
    unit.wadjetObeliskCooldown = Math.max(0, unit.wadjetObeliskCooldown - TICK_DT)
    unit.attackAnimTimer = Math.max(0, unit.attackAnimTimer - TICK_DT)
    unit.revenantAttackCooldown = Math.max(0, unit.revenantAttackCooldown - TICK_DT)
    unit.forsakenLeapCooldown = Math.max(0, unit.forsakenLeapCooldown - TICK_DT)

    if (isChannelingBeam(unit.id, activeBeams)) {
      unit.state = 'attack'
      continue
    }

    if (isHarbingerChanneling(unit.id, activeBeams)) {
      unit.state = 'attack'
      continue
    }

    if (unit.harbChargeTimeLeft > 0) {
      tickHarbingerCharge(unit, TICK_DT, units)
      continue
    }

    if (unit.koboChargeTimeLeft > 0) {
      tickKoboCharge(unit, TICK_DT, units, shockwaves)
      continue
    }

    if (unit.leapTimeLeft > 0) {
      const leapDef = MONSTER_MAP[unit.monsterId]
      if (leapDef.tags.includes('coral_leap_special')) {
        tickCoralLeap(unit, TICK_DT, units, shockwaves)
      } else if (leapDef.tags.includes('forsaken_special')) {
        tickForsakenApproachLeap(unit, TICK_DT, units)
      } else {
        tickLeap(unit, TICK_DT, units, shockwaves)
      }
      continue
    }

    const def = MONSTER_MAP[unit.monsterId]
    const isLux = def.tags.includes('lux_boss')
    const isRemnant = def.tags.includes('remnant_boss')
    const isHarbinger = def.tags.includes('harbinger_boss')
    const isWarden = def.tags.includes('warden_special')
    const isWadjet = def.tags.includes('wadjet_boss')
    const isKobo = def.tags.includes('kobo_boss')
    const isTremorsaurus = def.tags.includes('tremorsaurus_special')
    const isEnder = def.tags.includes('ender_golem_boss')
    const isMosco = def.tags.includes('mosco_special')
    const isCyclops = def.tags.includes('cyclops_special')
    const isAmethystCrab = def.tags.includes('amethyst_crab_special')
    const isRevenant = def.tags.includes('revenant_special')
    const isCoralLeap = def.tags.includes('coral_leap_special')
    const isForsaken = def.tags.includes('forsaken_special')

    if (isHarbinger) {
      tickHarbingerPassive(unit, TICK_DT)
    }

    if (isLux && def.tags.includes('meteor_passive')) {
      tickLuxMeteorPassive(unit, TICK_DT, meteors)
    }

    const allies = units.filter((u) => u.team === unit.team)

    if (isForsaken) {
      tickForsakenRegen(unit, TICK_DT)
    }

    if (isFeared(unit)) {
      unit.state = 'idle'
      tickUnitDrift(unit, TICK_DT, def.tags, 0.95)
      separate(unit, allies, TICK_DT)
      clampPosition(unit)
      continue
    }

    if (isTremorsaurus && tickTremorsaurusRoar(unit, TICK_DT, units, shockwaves)) {
      continue
    }

    if (isMosco) {
      tryTransformWarpedMosco(unit)
    }

    unit.retargetTimer -= TICK_DT
    const forceRetarget = unit.retargetTimer <= 0
    if (forceRetarget) {
      unit.retargetTimer = TARGET_RETARGET_INTERVAL
    }

    const target = pickTarget(unit, units, forceRetarget)
    unit.targetId = target?.id ?? null

    if (isRemnant && unit.remnantCastTimeLeft > 0) {
      tickRemnantCast(unit, TICK_DT)
      continue
    }

    if (isWadjet && unit.wadjetCastTimeLeft > 0) {
      tickWadjetCast(unit, TICK_DT, units, coneStrikes)
      continue
    }

    if (isKobo && unit.koboCastTimeLeft > 0) {
      tickKoboCast(unit, TICK_DT, units, coneStrikes, shockwaves, target, allies)
      continue
    }

    if (isEnder && tickEnderGolemCast(unit, TICK_DT)) {
      continue
    }

    if (isMosco && tickMoscoCast(unit, TICK_DT)) {
      continue
    }

    if (isAmethystCrab && tickAmethystCrab(unit, TICK_DT, units, shockwaves)) {
      continue
    }

    if (isRevenant && tickRevenantCast(unit, TICK_DT, units, coneStrikes, projectiles, shockwaves)) {
      continue
    }

    if (isForsaken && tickForsakenCast(unit, TICK_DT, units, shockwaves, forsakenArcWaves)) {
      continue
    }

    if (!target) {
      idleWander(unit, allies, def.tags)
      continue
    }

    const dist = distance(unit.x, unit.y, target.x, target.y)
    unit.facing = target.x >= unit.x ? 1 : -1

    const inMelee = dist <= unit.attackRange && canTargetForAttack(unit, target, false)
    const inBeamRange = def.tags.includes('beam_skill') && dist <= getTremorBeam().castRange
    const wantLuxLeap = isLux && shouldLeap(dist, inMelee, unit.leapCooldown)

    if (isRemnant) {
      const queuedInvalid =
        !unit.remnantQueuedSkill
        || !isRemnantSkillReady(unit.remnantQueuedSkill, unit, sandTornados)
        || !isRemnantSkillAllowed(unit.remnantQueuedSkill, target)
      if (queuedInvalid) {
        unit.remnantQueuedSkill = rollRemnantSkill(unit, target, sandTornados)
      }

      const queued = unit.remnantQueuedSkill
      if (queued && isRemnantSkillInRange(queued, unit, target, dist) && unit.attackCooldown <= 0) {
        unit.state = 'attack'
        startRemnantCast(
          unit,
          queued,
          target,
          units,
          shockwaves,
          sandTornados,
          obeliskBarrages,
          fallingObelisks,
          coneStrikes,
        )
        continue
      }

      if (queued && !isRemnantSkillInRange(queued, unit, target, dist)) {
        chaseTowardTarget(unit, target, allies)
        continue
      }

      if (queued) {
        applyAttackIntervalDrift(
          unit,
          allies,
          def.tags,
          isRemnantSkillInRange(queued, unit, target, dist),
          activeBeams,
        )
        unit.state = 'idle'
        continue
      }
    }

    if (isKobo && target) {
      const skill = pickKobolediatorSkill(unit, dist, target)
      const inRange = skill ? isKoboSkillInRange(skill, target, dist) : false

      if (skill && inRange && unit.attackCooldown <= 0) {
        if (skill === 'charge') startKoboCharge(unit, target, shockwaves)
        else startKoboCast(unit, skill, target, units, coneStrikes, shockwaves)
        continue
      }
      if (skill && !inRange) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      if (skill) {
        applyAttackIntervalDrift(unit, allies, def.tags, inRange, activeBeams)
        unit.state = 'attack'
        continue
      }
      chaseTowardTarget(unit, target, allies)
      continue
    }

    if (isWarden && target) {
      const wc = getWardenConfig()
      const rangedReady = unit.skillCooldown <= 0
      const inRanged = dist <= wc.rangedRange
      const inWardenMelee = dist <= wc.meleeRange

      if (rangedReady && inRanged) {
        unit.state = 'attack'
        wardenRangedAttack(unit, target, shockwaves)
        unit.skillCooldown = wc.rangedCooldown
        continue
      }

      if (!rangedReady) {
        applyAttackIntervalDrift(unit, allies, def.tags, inWardenMelee, activeBeams)
        if (inWardenMelee && unit.attackCooldown <= 0) {
          unit.state = 'attack'
          wardenMeleeAttack(unit, target)
          unit.attackCooldown = wc.meleeInterval
          continue
        }
        if (!inWardenMelee) {
          chaseTowardTarget(unit, target, allies)
          continue
        }
        unit.state = 'attack'
        continue
      }

      if (rangedReady && !inRanged) {
        chaseTowardTarget(unit, target, allies)
        continue
      }

      chaseTowardTarget(unit, target, allies)
      continue
    }

    if (isWadjet && target) {
      const skill = pickWadjetSkill(unit, target)
      const inRange = skill ? isWadjetSkillInRange(skill, target, dist) : false

      if (skill && inRange && unit.attackCooldown <= 0) {
        startWadjetCast(
          unit,
          skill,
          target,
          units,
          coneStrikes,
          linearSandTornados,
          obeliskBarrages,
        )
        continue
      }
      if (skill && !inRange) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      if (skill) {
        applyAttackIntervalDrift(unit, allies, def.tags, inRange, activeBeams)
        unit.state = 'attack'
        continue
      }
      if (!inRange) {
        chaseTowardTarget(unit, target, allies)
      } else {
        applyAttackIntervalDrift(unit, allies, def.tags, false, activeBeams)
        unit.state = 'attack'
      }
      continue
    }

    if (isHarbinger && target) {
      if (isHarbingerBusy(unit, activeBeams)) {
        continue
      }

      applyAttackIntervalDrift(unit, allies, def.tags, true, activeBeams, { always: true })

      const harbDist = distance(unit.x, unit.y, target.x, target.y)
      unit.facing = target.x >= unit.x ? 1 : -1

      if (unit.harbSkillTimer <= 0) {
        if (isWithinCastRange(harbDist, unit.attackRange, target)) {
          unit.state = 'attack'
          tryCastHarbingerSkill(unit, target, units, projectiles, activeBeams, shockwaves)
          unit.attackCooldown = unit.attackInterval
        } else {
          chaseTowardTarget(unit, target, allies, 0.45)
        }
        continue
      }

      const inHarbRange = isWithinCastRange(harbDist, unit.attackRange, target)

      if (inHarbRange && unit.attackCooldown <= 0) {
        unit.state = 'attack'
        harbingerNormalAttack(unit, target, projectiles)
        unit.attackCooldown = unit.attackInterval
        continue
      }

      if (!inHarbRange) {
        chaseTowardTarget(unit, target, allies, 0.45)
        continue
      }

      unit.state = 'attack'
      continue
    }

    if (isEnder && target) {
      const skill = pickEnderGolemSkill(target)
      const inRange = skill ? isEnderSkillInRange(skill, unit, target, dist, units) : false

      if (skill && inRange && unit.attackCooldown <= 0) {
        executeEnderGolemSkill(unit, skill, target, units, shockwaves, voidRunes)
        continue
      }
      if (!inRange) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      applyAttackIntervalDrift(unit, allies, def.tags, inRange, activeBeams)
      unit.state = 'attack'
      continue
    }

    if (isMosco && target) {
      if (isMoscoInFrenzy(unit)) {
        applyAttackIntervalDrift(unit, allies, def.tags, true, activeBeams, { always: true, speedMul: 1.05 })
        unit.facing = target.x >= unit.x ? 1 : -1

        const inRanged = isWithinCastRange(dist, unit.attackRange, target)
        if (inRanged && unit.attackCooldown <= 0) {
          unit.state = 'attack'
          spawnProjectile(unit, target, projectiles)
          unit.attackCooldown = unit.attackInterval
          continue
        }
        if (!inRanged) {
          chaseTowardTarget(unit, target, allies)
        } else {
          unit.state = 'chase'
        }
        continue
      }

      const skill = pickMoscoSkill(target)
      const inRange = skill ? isMoscoSkillInRange(skill, unit, target, dist, units) : false

      if (skill && inRange && unit.attackCooldown <= 0) {
        executeMoscoGroundSkill(unit, skill, target, units, shockwaves)
        continue
      }
      if (!inRange) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      applyAttackIntervalDrift(unit, allies, def.tags, inRange, activeBeams)
      unit.state = 'attack'
      continue
    }

    if (isCyclops && target) {
      const action = pickCyclopsAction(target)
      const inRange = isCyclopsActionInRange(action, unit, target, dist)

      if (inRange && unit.attackCooldown <= 0) {
        if (action === 'devour') {
          executeCyclopsDevour(unit, target)
        } else {
          executeCyclopsSlam(unit, target, units, shockwaves)
        }
        continue
      }
      if (!inRange) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      applyAttackIntervalDrift(unit, allies, def.tags, inRange, activeBeams)
      unit.state = 'attack'
      continue
    }

    if (isAmethystCrab && target) {
      if (!isAmethystCrabBusy(unit) && hasEnemyInEmergeRange(unit, units)) {
        startAmethystCrabBurrow(unit)
        continue
      }
      if (!isAmethystCrabBusy(unit)) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      unit.state = 'attack'
      continue
    }

    if (isRevenant && target) {
      if (!isRevenantBusy(unit) && unit.revenantAttackCooldown <= 0) {
        const skill = pickRevenantSkill(unit, target, dist)
        if (skill) {
          startRevenantCast(unit, skill, target, coneStrikes)
          continue
        }
      }
      if (!isRevenantBusy(unit)) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      unit.state = 'attack'
      continue
    }

    if (isCoralLeap && target) {
      if (canCoralLeapAttack(unit, target, dist) && unit.attackCooldown <= 0) {
        startCoralLeap(unit, target)
        unit.attackCooldown = unit.attackInterval
        continue
      }
      chaseTowardTarget(unit, target, allies)
      continue
    }

    if (isForsaken && target) {
      if (shouldForsakenApproachLeap(unit, dist)) {
        startForsakenApproachLeap(unit, target, units)
        continue
      }
      if (!isForsakenBusy(unit) && unit.attackCooldown <= 0) {
        const skill = pickForsakenSkill(unit, target, dist)
        if (skill) {
          startForsakenCast(unit, skill, target)
          unit.attackCooldown = unit.attackInterval
          continue
        }
      }
      if (!isForsakenBusy(unit)) {
        chaseTowardTarget(unit, target, allies)
        continue
      }
      unit.facing = target.x >= unit.x ? 1 : -1
      continue
    }

    if (wantLuxLeap && unit.attackCooldown <= 0) {
      unit.state = 'attack'
      startLeap(unit, target)
      unit.attackCooldown = unit.attackInterval
    } else if (
      inMelee
      || (def.tags.includes('beam_skill') && unit.skillCooldown <= 0 && inBeamRange)
    ) {
      unit.state = 'attack'
      const inAttackPos =
        inMelee || (def.tags.includes('beam_skill') && inBeamRange)
      applyAttackIntervalDrift(unit, allies, def.tags, inAttackPos, activeBeams)

      if (def.tags.includes('beam_skill') && unit.skillCooldown <= 0 && inBeamRange && unit.attackCooldown <= 0) {
        fireSuperBeam(unit, target, activeBeams)
        unit.attackCooldown = unit.attackInterval
      } else if (isLux && inMelee && unit.attackCooldown <= 0) {
        if (unit.luxNextStomp) luxStomp(unit, target, units, shockwaves)
        else luxTailSwipe(unit, units, shockwaves)
        unit.attackCooldown = unit.attackInterval
      } else if (inMelee && unit.attackCooldown <= 0 && !isRemnant && !isWarden && !isWadjet && !isKobo && !isEnder && !isMosco && !isCyclops && !isAmethystCrab && !isRevenant && !isCoralLeap && !isForsaken) {
        if (def.tags.includes('aoe_melee')) {
          aoeMeleeAttack(unit, target, units, shockwaves)
        } else if (unit.attackType === 'melee') {
          meleeAttack(unit, target)
        } else {
          spawnProjectile(unit, target, projectiles)
        }
        unit.attackCooldown = unit.attackInterval

        if (def.tags.includes('explosive')) {
          applyExplosion(unit, units, def.attack, 100)
          unit.hp = 0
          unit.state = 'dead'
        }
      }
    } else {
      chaseTowardTarget(unit, target, allies)
    }
  }

  for (const unit of units) {
    if (unit.state !== 'dead') clampPosition(unit)
  }

  tickConeStrikes(coneStrikes, TICK_DT)

  tickHarbingerProjectiles(projectiles, units, TICK_DT, shockwaves)
  updateProjectiles(projectiles, units)

  return {
    units,
    projectiles,
    shockwaves,
    activeBeams,
    meteors,
    lavaPatches,
    sandTornados,
    obeliskBarrages,
    fallingObelisks,
    coneStrikes,
    linearSandTornados,
    forsakenArcWaves,
    voidRunes,
    tick: snapshot.tick + 1,
    winner: checkWinner(units),
  }
}

export { BATTLE_FIELD } from './field'

export function createDeployId() {
  return uid()
}
