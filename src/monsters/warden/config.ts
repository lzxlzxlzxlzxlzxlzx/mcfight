export const MONSTER_ID = 'warden' as const

export interface WardenConfig {
  hp: number
  armor: number
  moveSpeed: number
  meleeRange: number
  meleeDamage: number
  meleeInterval: number
  rangedRange: number
  rangedDamage: number
  rangedCooldown: number
  radius: number
}

export function wardenDefaults(): WardenConfig {
  return {
    hp: 500,
    armor: 0,
    moveSpeed: 78,
    meleeRange: 48,
    meleeDamage: 30,
    meleeInterval: 1.5,
    rangedRange: 220,
    rangedDamage: 10,
    rangedCooldown: 10,
    radius: 22,
  }
}

let runtimeConfig = wardenDefaults()

export function getWardenConfig(): WardenConfig {
  return runtimeConfig
}

export function setWardenConfig(cfg: WardenConfig) {
  runtimeConfig = cfg
}

export function applyWardenToDef(
  patchMonsterDef: (id: string, patch: Record<string, unknown>) => void,
  cfg: WardenConfig,
) {
  patchMonsterDef(MONSTER_ID, {
    hp: cfg.hp,
    armor: cfg.armor,
    moveSpeed: cfg.moveSpeed,
    attack: cfg.meleeDamage,
    attackInterval: cfg.meleeInterval,
    attackRange: cfg.meleeRange,
    radius: cfg.radius,
  })
}
