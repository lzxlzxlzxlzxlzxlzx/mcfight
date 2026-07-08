import { BATTLE_FIELD, getUnitVisualHalfExtent } from './field'
import type { BattleUnit } from './types'

export function initUnitDrift(unit: BattleUnit) {
  unit.driftAngle = Math.random() * Math.PI * 2
  unit.driftTimer = 0.3 + Math.random() * 0.7
}

export function tickUnitDrift(
  unit: BattleUnit,
  dt: number,
  tags: readonly string[],
  speedMultiplier = 0.72,
  field = BATTLE_FIELD,
) {
  if (unit.driftTimer <= 0) {
    unit.driftAngle = Math.random() * Math.PI * 2
    unit.driftTimer = 0.35 + Math.random() * 0.85
  }
  unit.driftTimer -= dt

  const half = getUnitVisualHalfExtent(tags)
  const driftSpeed = unit.moveSpeed * speedMultiplier
  let nx = unit.x + Math.cos(unit.driftAngle) * driftSpeed * dt
  let ny = unit.y + Math.sin(unit.driftAngle) * driftSpeed * dt

  if (nx < half || nx > field.width - half) {
    unit.driftAngle = Math.PI - unit.driftAngle
    nx = Math.max(half, Math.min(field.width - half, nx))
  }
  if (ny < half || ny > field.height - half) {
    unit.driftAngle = -unit.driftAngle
    ny = Math.max(half, Math.min(field.height - half, ny))
  }

  unit.x = nx
  unit.y = ny
}
