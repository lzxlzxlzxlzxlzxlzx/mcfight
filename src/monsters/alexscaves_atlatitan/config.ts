export const MONSTER_ID = 'alexscaves_atlatitan' as const

export interface AtlatitanConfig {
  hp: number
  attack: number
  armor: number
  moveSpeed: number
  radius: number
  attackRange: number
  attackInterval: number
  aoeRadius: number
}

export function atlatitanDefaults(): AtlatitanConfig {
  return {
    hp: 400,
    attack: 8,
    armor: 0,
    moveSpeed: 52,
    radius: 24,
    attackRange: 48,
    attackInterval: 2,
    aoeRadius: 56,
  }
}

let runtimeConfig = atlatitanDefaults()

export function getAtlantitanConfig(): AtlatitanConfig {
  return runtimeConfig
}

export function setAtlantitanConfig(cfg: AtlatitanConfig) {
  runtimeConfig = cfg
}
