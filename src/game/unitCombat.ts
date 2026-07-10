import type { BattleUnit } from './types'

/** 目标碰撞体纳入施法距离时的半径系数（全局统一） */
export const TARGET_RADIUS_PAD = 0.35

/** 每隔多久强制重选最近可攻击目标（秒） */
export const TARGET_RETARGET_INTERVAL = 2.5

/** 技能是否允许对当前目标释放（地面技能不可对飞行单位） */
export function isSkillAllowedForTarget(
  groundOnly: boolean,
  target: BattleUnit,
): boolean {
  if (!groundOnly) return true
  return target.moveType === 'ground'
}

/** 敌人是否在指定技能/攻击距离内 */
export function isWithinCastRange(
  dist: number,
  range: number,
  target: BattleUnit,
  padding = TARGET_RADIUS_PAD,
): boolean {
  return dist <= range + target.radius * padding
}
