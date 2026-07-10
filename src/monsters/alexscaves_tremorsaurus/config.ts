export const MONSTER_ID = 'alexscaves_tremorsaurus' as const

export interface TremorsaurusConfig {
  hp: number
  attack: number
  armor: number
  moveSpeed: number
  radius: number
  attackRange: number
  attackInterval: number
  roarIntervalMin: number
  roarIntervalMax: number
  roarDuration: number
  roarVisualRadius: number
}

export function tremorsaurusDefaults(): TremorsaurusConfig {
  return {
    hp: 150,
    attack: 14,
    armor: 8,
    moveSpeed: 58,
    radius: 18,
    attackRange: 42,
    attackInterval: 0.7,
    roarIntervalMin: 10,
    roarIntervalMax: 15,
    roarDuration: 2,
    roarVisualRadius: 140,
  }
}

let runtimeConfig = tremorsaurusDefaults()

export function getTremorsaurusConfig(): TremorsaurusConfig {
  return runtimeConfig
}

export function setTremorsaurusConfig(cfg: TremorsaurusConfig) {
  runtimeConfig = cfg
}
