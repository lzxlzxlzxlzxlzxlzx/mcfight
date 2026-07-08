import type { ConfigGroupDef } from '../../game/configTypes'

export const MONSTER_ID = 'cataclysm_ancient_remnant' as const

const R = 8

export interface RemnantConfig {
  hp: number
  attack: number
  armor: number
  moveSpeed: number
  attackInterval: number
  biteRange: number
  radius: number
  skillCastDuration: number
  biteBase: number
  bitePctMaxHp: number
  tailRadius: number
  tailBase: number
  tailPctMaxHp: number
  sandstormCount: number
  sandstormDuration: number
  sandstormDamage: number
  sandstormHitCooldown: number
  sandstormOrbitRadius: number
  sandstormHitRadius: number
  sandstormAngularSpeed: number
  stompConeLength: number
  stompConeAngleDeg: number
  stompWaveWidth: number
  stompBase: number
  stompPctMaxHp: number
  obeliskBase: number
  obeliskPctMaxHp: number
  obeliskMaxRadius: number
  obeliskRingCount: number
  obeliskRingInterval: number
  obeliskFallDuration: number
  obeliskImpactRadius: number
  obeliskSpacing: number
  obeliskCooldown: number
}

export function remnantDefaults(): RemnantConfig {
  return {
    hp: 420,
    attack: 22,
    armor: 12,
    moveSpeed: 36,
    attackInterval: 3,
    biteRange: 55,
    radius: 56,
    skillCastDuration: 3,
    biteBase: 34,
    bitePctMaxHp: 5,
    tailRadius: 10 * R,
    tailBase: 26,
    tailPctMaxHp: 5,
    sandstormCount: 3,
    sandstormDuration: 15,
    sandstormDamage: 5,
    sandstormHitCooldown: 1,
    sandstormOrbitRadius: 12 * R,
    sandstormHitRadius: 28,
    sandstormAngularSpeed: 2.2,
    stompConeLength: 24 * R,
    stompConeAngleDeg: 30,
    stompWaveWidth: 110,
    stompBase: 23,
    stompPctMaxHp: 3.5,
    obeliskBase: 18,
    obeliskPctMaxHp: 5,
    obeliskMaxRadius: 25 * R,
    obeliskRingCount: 7,
    obeliskRingInterval: 0.38,
    obeliskFallDuration: 0.5,
    obeliskImpactRadius: 38,
    obeliskSpacing: 52,
    obeliskCooldown: 20,
  }
}

export const REMNANT_SKILL_GROUPS: ConfigGroupDef[] = [
  {
    title: '技能释放',
    fields: [
      { key: 'skillCastDuration', label: '释放时长', unit: '秒', min: 0.5, step: 0.1 },
    ],
  },
  {
    title: '撕咬',
    fields: [
      { key: 'biteRange', label: '近战距离', unit: 'px', min: 1, step: 1 },
      { key: 'biteBase', label: '基础伤害', unit: '', min: 0, step: 0.5 },
      { key: 'bitePctMaxHp', label: '最大生命百分比', unit: '%', min: 0, step: 0.5 },
    ],
  },
  {
    title: '甩尾',
    fields: [
      { key: 'tailRadius', label: '范围半径', unit: 'px', min: 1, step: 1 },
      { key: 'tailBase', label: '基础伤害', unit: '', min: 0, step: 0.5 },
      { key: 'tailPctMaxHp', label: '最大生命百分比', unit: '%', min: 0, step: 0.5 },
    ],
  },
  {
    title: '沙暴',
    fields: [
      { key: 'sandstormCount', label: '龙卷风数量', unit: '个', min: 1, step: 1 },
      { key: 'sandstormDuration', label: '持续时间', unit: '秒', min: 1, step: 1 },
      { key: 'sandstormDamage', label: '触碰伤害', unit: '', min: 0, step: 0.5 },
      { key: 'sandstormHitCooldown', label: '同敌伤害间隔', unit: '秒', min: 0.1, step: 0.1 },
      { key: 'sandstormOrbitRadius', label: '环绕半径', unit: 'px', min: 1, step: 1 },
      { key: 'sandstormHitRadius', label: '龙卷风半径', unit: 'px', min: 1, step: 1 },
      { key: 'sandstormAngularSpeed', label: '旋转速度', unit: 'rad/s', min: 0.1, step: 0.1 },
    ],
  },
  {
    title: '践踏',
    fields: [
      { key: 'stompConeLength', label: '最大扩散距离', unit: 'px', min: 1, step: 1 },
      { key: 'stompConeAngleDeg', label: '圆弧张角', unit: '°', min: 10, step: 5 },
      { key: 'stompWaveWidth', label: '海浪宽度', unit: 'px', min: 20, step: 1 },
      { key: 'stompBase', label: '基础伤害', unit: '', min: 0, step: 0.5 },
      { key: 'stompPctMaxHp', label: '最大生命百分比', unit: '%', min: 0, step: 0.5 },
    ],
  },
  {
    title: '远古石碑',
    fields: [
      { key: 'obeliskBase', label: '基础伤害', unit: '', min: 0, step: 0.5 },
      { key: 'obeliskPctMaxHp', label: '最大生命百分比', unit: '%', min: 0, step: 0.5 },
      { key: 'obeliskMaxRadius', label: '最外圈半径', unit: 'px', min: 1, step: 1 },
      { key: 'obeliskRingCount', label: '圈数', unit: '圈', min: 2, step: 1 },
      { key: 'obeliskRingInterval', label: '圈间间隔', unit: '秒', min: 0.1, step: 0.05 },
      { key: 'obeliskFallDuration', label: '下落时长', unit: '秒', min: 0.1, step: 0.05 },
      { key: 'obeliskImpactRadius', label: '落点伤害半径', unit: 'px', min: 1, step: 1 },
      { key: 'obeliskSpacing', label: '圈上石碑间距', unit: 'px', min: 20, step: 1 },
      { key: 'obeliskCooldown', label: '冷却', unit: '秒', min: 1, step: 1 },
    ],
  },
]

export function applyRemnantToDef(
  patchMonsterDef: (id: string, patch: Record<string, unknown>) => void,
  cfg: RemnantConfig,
) {
  patchMonsterDef(MONSTER_ID, {
    hp: cfg.hp,
    attack: cfg.attack,
    armor: cfg.armor,
    moveSpeed: cfg.moveSpeed,
    attackInterval: cfg.attackInterval,
    attackRange: cfg.biteRange,
    radius: cfg.radius,
  })
}

let runtimeConfig = remnantDefaults()

export function getRemnantConfig(): RemnantConfig {
  return runtimeConfig
}

export function setRemnantConfig(cfg: RemnantConfig) {
  runtimeConfig = cfg
}
