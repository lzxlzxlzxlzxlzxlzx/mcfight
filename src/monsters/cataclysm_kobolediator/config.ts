export const MONSTER_ID = 'cataclysm_kobolediator' as const

export interface KobolediatorConfig {
  hp: number
  armor: number
  moveSpeed: number
  radius: number
  engageRange: number
  chargeMinDist: number
  chargeDuration: number
  chargeDamage: number
  chargeRadius: number
  tripleCastDuration: number
  tripleSlashDamage: number
  tripleFinaleDamage: number
  tripleConeLength: number
  tripleConeAngleDeg: number
  tripleConeOffsetDeg: number
  tripleFinaleRadius: number
  stompCastDuration: number
  stompDamage: number
  stompConeLength: number
  stompConeAngleDeg: number
  rangedBlockPct: number
}

export function kobolediatorDefaults(): KobolediatorConfig {
  const R = 8
  return {
    hp: 180,
    armor: 10,
    moveSpeed: 56,
    radius: 20,
    engageRange: 260,
    chargeMinDist: 120,
    chargeDuration: 2,
    chargeDamage: 18,
    chargeRadius: 72,
    tripleCastDuration: 3,
    tripleSlashDamage: 14,
    tripleFinaleDamage: 18,
    tripleConeLength: 9 * R,
    tripleConeAngleDeg: 55,
    tripleConeOffsetDeg: 32,
    tripleFinaleRadius: 9 * R,
    stompCastDuration: 3,
    stompDamage: 14,
    stompConeLength: 28 * R,
    stompConeAngleDeg: 38,
    rangedBlockPct: 50,
  }
}

let runtimeConfig = kobolediatorDefaults()

export function getKobolediatorConfig(): KobolediatorConfig {
  return runtimeConfig
}

export function setKobolediatorConfig(cfg: KobolediatorConfig) {
  runtimeConfig = cfg
}

export function applyKobolediatorToDef(
  patchMonsterDef: (id: string, patch: Record<string, unknown>) => void,
  cfg: KobolediatorConfig,
) {
  patchMonsterDef(MONSTER_ID, {
    hp: cfg.hp,
    armor: cfg.armor,
    moveSpeed: cfg.moveSpeed,
    attack: cfg.tripleSlashDamage,
    attackInterval: cfg.tripleCastDuration,
    attackRange: cfg.engageRange,
    radius: cfg.radius,
  })
}
