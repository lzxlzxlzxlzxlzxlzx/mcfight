import type { BattleUnit, StatusEffectType } from './types'
import { MONSTER_MAP } from '../data/monsters'

export const STATUS_CONFIG = {
  poison: { dps: 2, duration: 5 },
  burn: { dps: 1, duration: 10 },
  wither: { dps: 3, duration: 4 },
  slow: { duration: 5, speedMult: 0.7 },
} as const

export const FLY_MELEE_VULN_WINDOW = 0.55
export const BURN_SPREAD_RADIUS = 52

export function applyStatusEffect(unit: BattleUnit, type: StatusEffectType) {
  if (type === 'burn' && MONSTER_MAP[unit.monsterId].tags.includes('fire_immune')) return
  const cfg = STATUS_CONFIG[type]
  const existing = unit.statusEffects.find((e) => e.type === type)
  if (existing) {
    existing.remaining = cfg.duration
    return
  }
  unit.statusEffects.push({ type, remaining: cfg.duration, dotTimer: 0 })
}

export function applyStatusEffects(unit: BattleUnit, types: StatusEffectType[]) {
  for (const type of types) applyStatusEffect(unit, type)
}

function dealTrueDamage(unit: BattleUnit, amount: number) {
  unit.hp -= amount
  if (unit.hp <= 0) unit.state = 'dead'
}

function spreadBurn(source: BattleUnit, units: BattleUnit[]) {
  for (const other of units) {
    if (other.id === source.id || other.state === 'dead') continue
    const dx = other.x - source.x
    const dy = other.y - source.y
    if (Math.hypot(dx, dy) <= source.radius + other.radius + BURN_SPREAD_RADIUS) {
      applyStatusEffect(other, 'burn')
    }
  }
}

export function tickStatusEffects(unit: BattleUnit, units: BattleUnit[], dt: number) {
  unit.vulnerableWindow = Math.max(0, unit.vulnerableWindow - dt)

  for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
    const effect = unit.statusEffects[i]
    effect.remaining -= dt
    if (effect.remaining <= 0) {
      unit.statusEffects.splice(i, 1)
      continue
    }

    if (effect.type === 'slow') continue
    if (effect.type === 'burn' && MONSTER_MAP[unit.monsterId].tags.includes('fire_immune')) continue

    const dps = STATUS_CONFIG[effect.type].dps
    effect.dotTimer += dt
    while (effect.dotTimer >= 1) {
      effect.dotTimer -= 1
      dealTrueDamage(unit, dps)
      if (unit.state === 'dead') return
      if (effect.type === 'burn') spreadBurn(unit, units)
    }
  }

  const slowed = unit.statusEffects.some((e) => e.type === 'slow')
  unit.moveSpeed = slowed ? unit.baseMoveSpeed * STATUS_CONFIG.slow.speedMult : unit.baseMoveSpeed
  unit.attackInterval = slowed
    ? unit.baseAttackInterval / STATUS_CONFIG.slow.speedMult
    : unit.baseAttackInterval
}
