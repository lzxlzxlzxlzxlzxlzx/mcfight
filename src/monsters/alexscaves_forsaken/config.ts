export const MONSTER_ID = 'alexscaves_forsaken' as const

export type ForsakenSkill = 'bite' | 'hammer' | 'sonic' | 'ranged_sonic'

export interface ForsakenConfig {
  hp: number
  armor: number
  moveSpeed: number
  radius: number
  regenPerSecond: number
  attackInterval: number
  leapDuration: number
  /** 超过此距离才触发接近跃击 */
  leapTriggerDistance: number
  leapCooldown: number
  biteDamage: number
  biteHits: number
  biteRange: number
  hammerDamage: number
  hammerRadius: number
  hammerRange: number
  sonicDamage: number
  sonicHits: number
  sonicRadius: number
  rangedSonicDamage: number
  /** 弧形声波外弧半径 */
  rangedSonicArcRadius: number
  /** 弧形声波张角的一半（度） */
  rangedSonicArcHalfDeg: number
  /** 超过此距离才可释放远程声波（无上限射程） */
  rangedSonicMinDistance: number
  rangedSonicSpeed: number
  rangedSonicCastDuration: number
  /** 索敌/追击感知距离 */
  engageRange: number
  skillCastDuration: number
}

export function forsakenDefaults(): ForsakenConfig {
  const R = 8
  return {
    hp: 250,
    armor: 0,
    moveSpeed: 62,
    radius: 20,
    regenPerSecond: 1,
    attackInterval: 2,
    leapDuration: 1,
    leapTriggerDistance: 100,
    leapCooldown: 10,
    biteDamage: 12,
    biteHits: 2,
    biteRange: 42,
    hammerDamage: 8,
    hammerRadius: 3 * R,
    hammerRange: 42,
    sonicDamage: 3,
    sonicHits: 4,
    sonicRadius: 8 * R,
    rangedSonicDamage: 4,
    rangedSonicArcRadius: 72,
    rangedSonicArcHalfDeg: 48,
    rangedSonicMinDistance: 36,
    rangedSonicSpeed: 360,
    rangedSonicCastDuration: 0.45,
    engageRange: 1280,
    skillCastDuration: 2,
  }
}

let runtimeConfig = forsakenDefaults()

export function getForsakenConfig(): ForsakenConfig {
  return runtimeConfig
}

export function setForsakenConfig(cfg: ForsakenConfig) {
  runtimeConfig = cfg
}
