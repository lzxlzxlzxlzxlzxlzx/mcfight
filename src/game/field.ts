import type { BattleUnit } from './types'

export const BATTLE_FIELD = { width: 1280, height: 720, midX: 640 }

/** 与 BattleCanvas 绘制尺寸一致：giant 112 / boss 56 / 其他 40 */
export function getUnitDisplaySize(tags: readonly string[]): number {
  if (tags.includes('giant')) return 112
  if (tags.includes('boss')) return 56
  return 40
}

export function getUnitVisualHalfExtent(tags: readonly string[]): number {
  return getUnitDisplaySize(tags) / 2
}

/** 战场边界钳制半径：碰撞体与贴图取较大值 */
export function getUnitFieldHalfExtent(
  unit: Pick<BattleUnit, 'radius'>,
  tags: readonly string[],
): number {
  return Math.max(unit.radius, getUnitVisualHalfExtent(tags))
}

/** 钳制单位中心点，保证精灵图整体不超出战场 */
export function clampUnitToField(
  unit: Pick<BattleUnit, 'x' | 'y' | 'radius'>,
  tags: readonly string[],
) {
  const half = getUnitFieldHalfExtent(unit, tags)
  unit.x = Math.max(half, Math.min(BATTLE_FIELD.width - half, unit.x))
  unit.y = Math.max(half, Math.min(BATTLE_FIELD.height - half, unit.y))
}

/** 钳制任意落点/终点坐标 */
export function clampDestinationPoint(
  x: number,
  y: number,
  radius: number,
  tags: readonly string[],
): { x: number; y: number } {
  const probe = { x, y, radius }
  clampUnitToField(probe, tags)
  return { x: probe.x, y: probe.y }
}

/** 钳制跃击落点 */
export function clampLeapDestination(
  unit: Pick<BattleUnit, 'leapToX' | 'leapToY' | 'radius'>,
  tags: readonly string[],
) {
  const dest = clampDestinationPoint(unit.leapToX, unit.leapToY, unit.radius, tags)
  unit.leapToX = dest.x
  unit.leapToY = dest.y
}

/** 跃击抛物线插值，飞行中与落点均不超出战场 */
export function setLeapArcPosition(
  unit: Pick<
    BattleUnit,
    'x' | 'y' | 'radius' | 'leapFromX' | 'leapFromY' | 'leapToX' | 'leapToY'
  >,
  tags: readonly string[],
  t: number,
  arcHeight: number,
) {
  const ease = t * (2 - t)
  unit.x = unit.leapFromX + (unit.leapToX - unit.leapFromX) * ease
  const baseY = unit.leapFromY + (unit.leapToY - unit.leapFromY) * ease
  const hop = Math.sin(t * Math.PI) * arcHeight
  const half = getUnitFieldHalfExtent(unit, tags)
  const cappedHop = Math.min(hop, Math.max(0, baseY - half))
  unit.y = baseY - cappedHop
  clampUnitToField(unit, tags)
}
