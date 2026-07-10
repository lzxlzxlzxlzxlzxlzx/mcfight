export const MONSTER_ID = 'cataclysm_ignited_revenant' as const

/** 与普通远程单位一致的射程（见 infer.ts） */
export const NORMAL_RANGED_ATTACK_RANGE = 160

export type RevenantSkill = 'spin' | 'breath' | 'bones'

export interface IgnitedRevenantConfig {
  hp: number
  armor: number
  moveSpeed: number
  radius: number
  postAttackCooldown: number
  spinDuration: number
  spinHits: number
  spinDamage: number
  spinRadius: number
  breathDuration: number
  breathHits: number
  breathDamage: number
  breathRange: number
  breathConeAngleDeg: number
  bonesDuration: number
  bonesCount: number
  bonesDamage: number
  bonesRange: number
  bonesProjectileSpeed: number
}

export function ignitedRevenantDefaults(): IgnitedRevenantConfig {
  const R = 8
  return {
    hp: 80,
    armor: 12,
    moveSpeed: 42,
    radius: 18,
    postAttackCooldown: 1,
    spinDuration: 2,
    spinHits: 3,
    spinDamage: 6,
    spinRadius: 2.5 * R,
    breathDuration: 2,
    breathHits: 4,
    breathDamage: 4,
    breathRange: 8 * R,
    breathConeAngleDeg: 55,
    bonesDuration: 2,
    bonesCount: 4,
    bonesDamage: 6,
    bonesRange: NORMAL_RANGED_ATTACK_RANGE,
    bonesProjectileSpeed: 300,
  }
}

let runtimeConfig = ignitedRevenantDefaults()

export function getIgnitedRevenantConfig(): IgnitedRevenantConfig {
  return runtimeConfig
}

export function setIgnitedRevenantConfig(cfg: IgnitedRevenantConfig) {
  runtimeConfig = cfg
}
