export const MONSTER_ID = 'cataclysm_coralssus' as const

export interface CoralssusConfig {
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

export function coralssusDefaults(): CoralssusConfig {
  const R = 8
  return {
    hp: 150,
    armor: 5,
    leapDamage: 11.5,
    moveSpeed: 48,
    radius: 22,
    leapMaxRange: 200,
    leapRadius: 3.5 * R,
    leapDuration: 1.6,
    attackInterval: 3,
  }
}

let runtimeConfig = coralssusDefaults()

export function getCoralssusConfig(): CoralssusConfig {
  return runtimeConfig
}

export function setCoralssusConfig(cfg: CoralssusConfig) {
  runtimeConfig = cfg
}
