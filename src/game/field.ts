import type { BattleUnit } from './types'

export const BATTLE_FIELD = { width: 960, height: 540, midX: 480 }

/** 与 BattleCanvas 绘制尺寸一致：giant 112 / boss 56 / 其他 40 */
export function getUnitDisplaySize(tags: readonly string[]): number {
  if (tags.includes('giant')) return 112
  if (tags.includes('boss')) return 56
  return 40
}

export function getUnitVisualHalfExtent(tags: readonly string[]): number {
  return getUnitDisplaySize(tags) / 2
}

/** 钳制单位中心点，保证精灵图整体不超出战场 */
export function clampUnitToField(
  unit: Pick<BattleUnit, 'x' | 'y' | 'radius'>,
  tags: readonly string[],
) {
  const half = Math.max(unit.radius, getUnitVisualHalfExtent(tags))
  unit.x = Math.max(half, Math.min(BATTLE_FIELD.width - half, unit.x))
  unit.y = Math.max(half, Math.min(BATTLE_FIELD.height - half, unit.y))
}
