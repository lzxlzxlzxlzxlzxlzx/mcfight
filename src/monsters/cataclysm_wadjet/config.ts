export const MONSTER_ID = 'cataclysm_wadjet' as const

export interface WadjetConfig {
  hp: number
  armor: number
  moveSpeed: number
  radius: number
  skillCastDuration: number
  engageRange: number
  sweepDamage: number
  sweepConeLength: number
  sweepConeAngleDeg: number
  sweepWaveWidth: number
  tornadoDamage: number
  tornadoSpeed: number
  tornadoHitRadius: number
  obeliskDamage: number
  obeliskMaxRadius: number
  obeliskRingCount: number
  obeliskRingInterval: number
  obeliskFallDuration: number
  obeliskImpactRadius: number
  obeliskSpacing: number
  obeliskCooldown: number
}

export function wadjetDefaults(): WadjetConfig {
  const R = 8
  return {
    hp: 150,
    armor: 5,
    moveSpeed: 52,
    radius: 20,
    skillCastDuration: 3,
    engageRange: 240,
    sweepDamage: 11,
    sweepConeLength: 10 * R,
    sweepConeAngleDeg: 88,
    sweepWaveWidth: 90,
    tornadoDamage: 15,
    tornadoSpeed: 210,
    tornadoHitRadius: 34,
    obeliskDamage: 18,
    obeliskMaxRadius: 13 * R,
    obeliskRingCount: 5,
    obeliskRingInterval: 0.36,
    obeliskFallDuration: 0.48,
    obeliskImpactRadius: 22,
    obeliskSpacing: 72,
    obeliskCooldown: 15,
  }
}

let runtimeConfig = wadjetDefaults()

export function getWadjetConfig(): WadjetConfig {
  return runtimeConfig
}

export function setWadjetConfig(cfg: WadjetConfig) {
  runtimeConfig = cfg
}

export function applyWadjetToDef(
  patchMonsterDef: (id: string, patch: Record<string, unknown>) => void,
  cfg: WadjetConfig,
) {
  patchMonsterDef(MONSTER_ID, {
    hp: cfg.hp,
    armor: cfg.armor,
    moveSpeed: cfg.moveSpeed,
    attack: cfg.sweepDamage,
    attackInterval: cfg.skillCastDuration,
    attackRange: cfg.engageRange,
    radius: cfg.radius,
  })
}
