import type { BattleSnapshot, BattleUnit, DeployedUnit, MonsterDef, Projectile } from './types'
import { MONSTER_MAP } from '../data/monsters'
import { getDamageAfterArmor } from './damage'

const FIELD = { width: 960, height: 540, midX: 480 }
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

function calcDamage(attack: number, target: BattleUnit) {
  const def = MONSTER_MAP[target.monsterId]
  return getDamageAfterArmor(attack, target.armor, def.armorToughness ?? 0)
}

function createBattleUnit(deployed: DeployedUnit, def: MonsterDef): BattleUnit {
  return {
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
  }
}

function enemiesOf(unit: BattleUnit, units: BattleUnit[]) {
  return units.filter((u) => u.team !== unit.team && u.state !== 'dead')
}

function canTarget(attacker: BattleUnit, target: BattleUnit) {
  if (attacker.attackType === 'melee' && target.moveType === 'fly') return false
  return true
}

function pickTarget(unit: BattleUnit, units: BattleUnit[]): BattleUnit | null {
  const enemies = enemiesOf(unit, units)
  if (enemies.length === 0) return null

  if (unit.targetId) {
    const current = enemies.find((e) => e.id === unit.targetId)
    if (current && canTarget(unit, current)) {
      const dist = distance(unit.x, unit.y, current.x, current.y)
      if (dist <= unit.attackRange + STICKY_RANGE_BONUS) return current
    }
  }

  let best: BattleUnit | null = null
  let bestScore = Infinity
  for (const enemy of enemies) {
    if (!canTarget(unit, enemy)) continue
    let score = distance(unit.x, unit.y, enemy.x, enemy.y)
    const def = MONSTER_MAP[unit.monsterId]
    if (def.tags.includes('anti_arthropod') && enemy.moveType === 'fly') score *= 0.75
    if (score < bestScore) {
      bestScore = score
      best = enemy
    }
  }
  return best
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
}

function clampPosition(unit: BattleUnit) {
  unit.x = Math.max(unit.radius + 8, Math.min(FIELD.width - unit.radius - 8, unit.x))
  unit.y = Math.max(unit.radius + 8, Math.min(FIELD.height - unit.radius - 8, unit.y))
}

function applyExplosion(source: BattleUnit, units: BattleUnit[], rawDamage: number, radius = 90) {
  for (const u of units) {
    if (u.state === 'dead') continue
    if (distance(source.x, source.y, u.x, u.y) <= radius) {
      u.hp -= calcDamage(rawDamage, u)
      if (u.hp <= 0) u.state = 'dead'
    }
  }
}

function meleeAttack(attacker: BattleUnit, target: BattleUnit) {
  target.hp -= calcDamage(attacker.attack, target)
  attacker.attackAnimTimer = 0.25
  if (target.hp <= 0) target.state = 'dead'
}

function spawnProjectile(
  attacker: BattleUnit,
  target: BattleUnit,
  projectiles: Projectile[],
) {
  projectiles.push({
    id: pid(),
    team: attacker.team,
    x: attacker.x,
    y: attacker.y,
    targetId: target.id,
    speed: 280,
    rawDamage: attacker.attack,
    sourceId: attacker.id,
  })
  attacker.attackAnimTimer = 0.25
}

function updateProjectiles(projectiles: Projectile[], units: BattleUnit[]) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]
    const target = units.find((u) => u.id === p.targetId && u.state !== 'dead')
    if (!target) {
      projectiles.splice(i, 1)
      continue
    }
    const dx = target.x - p.x
    const dy = target.y - p.y
    const dist = Math.hypot(dx, dy)
    if (dist < target.radius + 8) {
      target.hp -= calcDamage(p.rawDamage, target)
      if (target.hp <= 0) target.state = 'dead'
      projectiles.splice(i, 1)
      continue
    }
    const step = p.speed * TICK_DT
    p.x += (dx / dist) * step
    p.y += (dy / dist) * step
  }
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
    return createBattleUnit({ ...d, id: uid() }, def)
  })
  return { units, projectiles: [], tick: 0, winner: null }
}

export function stepBattle(snapshot: BattleSnapshot): BattleSnapshot {
  if (snapshot.winner !== null) return snapshot

  const units = snapshot.units.map((u) => ({ ...u }))
  const projectiles = snapshot.projectiles.map((p) => ({ ...p }))

  for (const unit of units) {
    if (unit.state === 'dead') continue
    unit.attackCooldown = Math.max(0, unit.attackCooldown - TICK_DT)
    unit.attackAnimTimer = Math.max(0, unit.attackAnimTimer - TICK_DT)

    const def = MONSTER_MAP[unit.monsterId]
    const allies = units.filter((u) => u.team === unit.team)

    const target = pickTarget(unit, units)
    unit.targetId = target?.id ?? null

    if (!target) {
      unit.state = 'idle'
      continue
    }

    const dist = distance(unit.x, unit.y, target.x, target.y)
    unit.facing = target.x >= unit.x ? 1 : -1

    if (dist <= unit.attackRange) {
      unit.state = 'attack'
      if (unit.attackCooldown <= 0) {
        if (unit.attackType === 'melee') {
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
      unit.state = 'chase'
      const dx = target.x - unit.x
      const dy = target.y - unit.y
      const len = Math.hypot(dx, dy) || 1
      unit.x += (dx / len) * unit.moveSpeed * TICK_DT
      unit.y += (dy / len) * unit.moveSpeed * TICK_DT
      separate(unit, allies, TICK_DT)
      clampPosition(unit)
    }
  }

  updateProjectiles(projectiles, units)

  return {
    units,
    projectiles,
    tick: snapshot.tick + 1,
    winner: checkWinner(units),
  }
}

export const BATTLE_FIELD = FIELD

export function createDeployId() {
  return uid()
}
