export const MONSTER_ID = 'cataclysm_coral_golem' as const

export interface CoralGolemConfig {
  hp: number
  armor: number
  leapDamage: number
  moveSpeed: number
  radius: number
  leapMaxRange: number
  leapRadius: number
  leapDuration: number
  attackInterval: number
}

export function coralGolemDefaults(): CoralGolemConfig {
  const R = 8
  return {
    hp: 110,
    armor: 5,
    leapDamage: 12.5,
    moveSpeed: 52,
    radius: 18,
    leapMaxRange: 200,
    leapRadius: 2.5 * R,
    leapDuration: 1.5,
    attackInterval: 3,
  }
}

let runtimeConfig = coralGolemDefaults()

export function getCoralGolemConfig(): CoralGolemConfig {
  return runtimeConfig
}

export function setCoralGolemConfig(cfg: CoralGolemConfig) {
  runtimeConfig = cfg
}
