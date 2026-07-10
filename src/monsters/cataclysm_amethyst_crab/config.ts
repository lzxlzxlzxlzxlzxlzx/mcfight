export const MONSTER_ID = 'cataclysm_amethyst_crab' as const

export interface AmethystCrabConfig {
  hp: number
  armor: number
  damage: number
  moveSpeed: number
  radius: number
  burrowDuration: number
  emergeCastDuration: number
  emergeRadius: number
  emergeRange: number
  sweepCastDuration: number
  sweepRadius: number
}

export function amethystCrabDefaults(): AmethystCrabConfig {
  const R = 8
  return {
    hp: 200,
    armor: 10,
    damage: 16,
    moveSpeed: 45,
    radius: 22,
    burrowDuration: 5,
    emergeCastDuration: 2,
    emergeRadius: 6 * R,
    emergeRange: 6 * R,
    sweepCastDuration: 3,
    sweepRadius: 2.5 * R,
  }
}

let runtimeConfig = amethystCrabDefaults()

export function getAmethystCrabConfig(): AmethystCrabConfig {
  return runtimeConfig
}

export function setAmethystCrabConfig(cfg: AmethystCrabConfig) {
  runtimeConfig = cfg
}
