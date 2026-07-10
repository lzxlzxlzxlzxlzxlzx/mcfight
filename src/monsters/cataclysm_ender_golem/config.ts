export const MONSTER_ID = 'cataclysm_ender_golem' as const

export interface EnderGolemConfig {
  hp: number
  armor: number
  moveSpeed: number
  radius: number
  attackInterval: number
  punchRange: number
  punchDamageMin: number
  punchDamageMax: number
  slamRadius: number
  slamDamageMin: number
  slamDamageMax: number
  voidRuneCastRange: number
  voidRuneBarLength: number
  voidRuneBarHalfWidth: number
  voidRuneCircleRadius: number
  voidRuneDamageMin: number
  voidRuneDamageMax: number
  /** 释放技能期间定身时长 */
  skillLockDuration: number
}

export function enderGolemDefaults(): EnderGolemConfig {
  const R = 8
  return {
    hp: 120,
    armor: 12,
    moveSpeed: 50,
    radius: 20,
    attackInterval: 2,
    punchRange: 42,
    punchDamageMin: 10,
    punchDamageMax: 14,
    slamRadius: 9 * R,
    slamDamageMin: 10,
    slamDamageMax: 16,
    voidRuneCastRange: 240,
    voidRuneBarLength: 28 * R,
    voidRuneBarHalfWidth: 1.5 * R,
    voidRuneCircleRadius: 6 * R,
    voidRuneDamageMin: 10,
    voidRuneDamageMax: 16,
    skillLockDuration: 1,
  }
}

let runtimeConfig = enderGolemDefaults()

export function getEnderGolemConfig(): EnderGolemConfig {
  return runtimeConfig
}

export function setEnderGolemConfig(cfg: EnderGolemConfig) {
  runtimeConfig = cfg
}
