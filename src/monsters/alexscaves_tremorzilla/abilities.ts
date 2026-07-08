import { getTremorBeamConfig, getTremorConfig } from './config'

/** 撼地斯拉 — 范围近战 + 超能射线 */
export const TREMORZILLA_ID = 'alexscaves_tremorzilla'

export function getTremorAoeRadius() {
  return getTremorConfig().aoeRadius
}

export function getTremorAttackRange() {
  return getTremorConfig().attackRange
}

export function getTremorAoeDamage() {
  return getTremorConfig().aoeDamage
}

export function getTremorBeam() {
  return getTremorBeamConfig(getTremorConfig())
}

export function beamTickInterval() {
  const beam = getTremorBeam()
  return beam.duration / beam.ticks
}

/** 点到线段距离（dir 为单位向量，线段长度 length） */
export function distPointToBeam(
  px: number,
  py: number,
  ox: number,
  oy: number,
  dirX: number,
  dirY: number,
  length: number,
) {
  const along = (px - ox) * dirX + (py - oy) * dirY
  const t = Math.max(0, Math.min(length, along))
  const cx = ox + dirX * t
  const cy = oy + dirY * t
  return Math.hypot(px - cx, py - cy)
}
