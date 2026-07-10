export const MONSTER_ID = 'iceandfire_cyclops' as const

export interface CyclopsConfig {
  hp: number
  armor: number
  moveSpeed: number
  radius: number
  smallMaxHp: number
  /** 吞噬后无法再次攻击的间隔（秒） */
  devourRecovery: number
  devourRange: number
  slamDamage: number
  slamInterval: number
  slamRadius: number
}

export function cyclopsDefaults(): CyclopsConfig {
  const R = 8
  return {
    hp: 150,
    armor: 20,
    moveSpeed: 48,
    radius: 22,
    smallMaxHp: 50,
    devourRecovery: 3,
    devourRange: 42,
    slamDamage: 17,
    slamInterval: 2,
    slamRadius: 6 * R,
  }
}

let runtimeConfig = cyclopsDefaults()

export function getCyclopsConfig(): CyclopsConfig {
  return runtimeConfig
}

export function setCyclopsConfig(cfg: CyclopsConfig) {
  runtimeConfig = cfg
}
