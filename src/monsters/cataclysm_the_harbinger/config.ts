import type { ConfigGroupDef } from '../../game/configTypes'

export const MONSTER_ID = 'cataclysm_the_harbinger' as const

export interface HarbingerConfig {
  hp: number
  attack: number
  armor: number
  moveSpeed: number
  attackRange: number
  radius: number
  regenPerSecond: number
  killHeal: number
  modeSwitchInterval: number
  witherMissileDamage: number
  witherMissileInterval: number
  witherMissileExplodeRadius: number
  laserDamage: number
  laserInterval: number
  skillInterval: number
  homingMissileCount: number
  homingMissileDamage: number
  homingMissileExplodeRadius: number
  homingMissileSpeed: number
  grenadeCount: number
  grenadeDamage: number
  grenadeRadius: number
  grenadeScatterRadius: number
  chargeDuration: number
  chargeSpeed: number
  chargeDamageBase: number
  chargeDamagePctMaxHp: number
  deathLaserDuration: number
  deathLaserBasePerSec: number
  deathLaserPctMaxHpPerSec: number
  deathLaserHalfWidth: number
  attackAnimDuration: number
}

export function harbingerDefaults(): HarbingerConfig {
  return {
    hp: 390,
    attack: 16,
    armor: 12,
    moveSpeed: 64,
    attackRange: 240,
    radius: 28,
    regenPerSecond: 2,
    killHeal: 5,
    modeSwitchInterval: 15,
    witherMissileDamage: 8,
    witherMissileInterval: 2,
    witherMissileExplodeRadius: 48,
    laserDamage: 5,
    laserInterval: 1,
    skillInterval: 10,
    homingMissileCount: 6,
    homingMissileDamage: 3,
    homingMissileExplodeRadius: 42,
    homingMissileSpeed: 320,
    grenadeCount: 8,
    grenadeDamage: 20,
    grenadeRadius: 58,
    grenadeScatterRadius: 160,
    chargeDuration: 0.55,
    chargeSpeed: 520,
    chargeDamageBase: 11,
    chargeDamagePctMaxHp: 6,
    deathLaserDuration: 5,
    deathLaserBasePerSec: 10,
    deathLaserPctMaxHpPerSec: 5,
    deathLaserHalfWidth: 18,
    attackAnimDuration: 0.35,
  }
}

export const HARBINGER_SKILL_GROUPS: ConfigGroupDef[] = [
  {
    title: '生存',
    fields: [
      { key: 'regenPerSecond', label: '每秒回复', unit: 'HP', min: 0, step: 0.5 },
      { key: 'killHeal', label: '击杀回复', unit: 'HP', min: 0, step: 1 },
    ],
  },
  {
    title: '普攻模式',
    fields: [
      { key: 'modeSwitchInterval', label: '模式切换间隔', unit: '秒', min: 1, step: 1 },
      { key: 'witherMissileDamage', label: '凋零飞弹伤害', unit: '', min: 0, step: 0.5 },
      { key: 'witherMissileInterval', label: '凋零飞弹间隔', unit: '秒', min: 0.2, step: 0.1 },
      { key: 'witherMissileExplodeRadius', label: '飞弹爆炸半径', unit: 'px', min: 1, step: 1 },
      { key: 'laserDamage', label: '激光射击伤害', unit: '', min: 0, step: 0.5 },
      { key: 'laserInterval', label: '激光射击间隔', unit: '秒', min: 0.2, step: 0.1 },
    ],
  },
  {
    title: '特殊技能',
    fields: [
      { key: 'skillInterval', label: '技能释放间隔', unit: '秒', min: 1, step: 0.5 },
      { key: 'homingMissileCount', label: '追踪导弹数量', unit: '颗', min: 1, step: 1 },
      { key: 'homingMissileDamage', label: '追踪导弹伤害', unit: '', min: 0, step: 0.5 },
      { key: 'homingMissileExplodeRadius', label: '导弹爆炸半径', unit: 'px', min: 1, step: 1 },
      { key: 'grenadeCount', label: '榴弹数量', unit: '颗', min: 1, step: 1 },
      { key: 'grenadeDamage', label: '榴弹伤害', unit: '', min: 0, step: 0.5 },
      { key: 'grenadeRadius', label: '榴弹爆炸半径', unit: 'px', min: 1, step: 1 },
      { key: 'chargeDamageBase', label: '冲撞基础伤害', unit: '', min: 0, step: 0.5 },
      { key: 'chargeDamagePctMaxHp', label: '冲撞生命百分比', unit: '%', min: 0, step: 0.5 },
      { key: 'deathLaserBasePerSec', label: '死亡激光基础秒伤', unit: '', min: 0, step: 0.5 },
      { key: 'deathLaserPctMaxHpPerSec', label: '死亡激光生命百分比', unit: '%/秒', min: 0, step: 0.5 },
      { key: 'deathLaserDuration', label: '死亡激光时长', unit: '秒', min: 1, step: 0.5 },
    ],
  },
]

export function applyHarbingerToDef(
  patchMonsterDef: (id: string, patch: Record<string, unknown>) => void,
  cfg: HarbingerConfig,
) {
  patchMonsterDef(MONSTER_ID, {
    hp: cfg.hp,
    attack: cfg.attack,
    armor: cfg.armor,
    moveSpeed: cfg.moveSpeed,
    attackRange: cfg.attackRange,
    radius: cfg.radius,
  })
}

let runtimeConfig = harbingerDefaults()

export function getHarbingerConfig(): HarbingerConfig {
  return runtimeConfig
}

export function setHarbingerConfig(cfg: HarbingerConfig) {
  runtimeConfig = cfg
}
