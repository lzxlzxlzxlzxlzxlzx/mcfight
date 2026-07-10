export const MONSTER_ID = 'alexsmobs_warped_mosco' as const

export interface WarpedMoscoConfig {
  hp: number
  armor: number
  moveSpeed: number
  radius: number
  meleeRange: number
  skillInterval: number
  punchDamage: number
  slapDamageMin: number
  slapDamageMax: number
  slapRadius: number
  drainDamage: number
  drainHeal: number
  drainLockDuration: number
  transformHpThreshold: number
  frenzyMoveSpeed: number
  frenzyAttack: number
  frenzyAttackInterval: number
  frenzyAttackRange: number
}

export function warpedMoscoDefaults(): WarpedMoscoConfig {
  const R = 8
  return {
    hp: 100,
    armor: 10,
    moveSpeed: 58,
    radius: 18,
    meleeRange: 42,
    skillInterval: 3,
    punchDamage: 15,
    slapDamageMin: 15,
    slapDamageMax: 26,
    slapRadius: 7 * R,
    drainDamage: 15,
    drainHeal: 10,
    drainLockDuration: 0.85,
    transformHpThreshold: 25,
    frenzyMoveSpeed: 128,
    frenzyAttack: 7,
    frenzyAttackInterval: 1,
    frenzyAttackRange: 180,
  }
}

let runtimeConfig = warpedMoscoDefaults()

export function getWarpedMoscoConfig(): WarpedMoscoConfig {
  return runtimeConfig
}

export function setWarpedMoscoConfig(cfg: WarpedMoscoConfig) {
  runtimeConfig = cfg
}
