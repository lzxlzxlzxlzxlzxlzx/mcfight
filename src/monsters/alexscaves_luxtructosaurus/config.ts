import type { ConfigGroupDef } from '../../game/configTypes'

export const MONSTER_ID = 'alexscaves_luxtructosaurus' as const

const R = 8

export interface LuxConfig {
  hp: number
  attack: number
  armor: number
  moveSpeed: number
  attackInterval: number
  meleeRange: number
  radius: number
  leapRadius: number
  leapDamage: number
  leapCooldown: number
  leapDuration: number
  leapPreferDist: number
  leapMaxRange: number
  tailRadius: number
  tailDamage: number
  stompRadius: number
  stompDamage: number
  meteorInterval: number
  meteorDamage: number
  meteorExplodeRadius: number
  meteorSpawnRadius: number
  meteorFallDuration: number
  lavaRadius: number
  lavaDuration: number
  lavaDps: number
  meleeAnimDuration: number
}

export function luxDefaults(): LuxConfig {
  const attack = 12
  return {
    hp: 600,
    attack,
    armor: 20,
    moveSpeed: 24,
    attackInterval: 2.2,
    meleeRange: 55,
    radius: 56,
    leapRadius: 6 * R,
    leapDamage: attack,
    leapCooldown: 10,
    leapDuration: 0.84,
    leapPreferDist: 100,
    leapMaxRange: 340,
    tailRadius: 14 * R,
    tailDamage: attack,
    stompRadius: 12 * R,
    stompDamage: attack,
    meteorInterval: 3,
    meteorDamage: 20,
    meteorExplodeRadius: Math.round((20 * R) / 3),
    meteorSpawnRadius: 200,
    meteorFallDuration: 0.55,
    lavaRadius: Math.round((20 * R) / 3),
    lavaDuration: 30,
    lavaDps: 5,
    meleeAnimDuration: 0.7,
  }
}

export const LUX_SKILL_GROUPS: ConfigGroupDef[] = [
  {
    title: '跃击',
    fields: [
      { key: 'leapRadius', label: '落地范围半径', unit: 'px', min: 1, step: 1 },
      { key: 'leapDamage', label: '落地伤害', unit: '', min: 0, step: 0.5 },
      { key: 'leapCooldown', label: '冷却', unit: '秒', min: 0, step: 0.5 },
      { key: 'leapDuration', label: '跳跃时长', unit: '秒', min: 0.1, step: 0.05 },
      { key: 'leapPreferDist', label: '触发最小距离', unit: 'px', min: 0, step: 1 },
      { key: 'leapMaxRange', label: '最大跃击距离', unit: 'px', min: 1, step: 1 },
    ],
  },
  {
    title: '甩尾',
    fields: [
      { key: 'tailRadius', label: '范围半径', unit: 'px', min: 1, step: 1 },
      { key: 'tailDamage', label: '伤害', unit: '', min: 0, step: 0.5 },
    ],
  },
  {
    title: '践踏',
    fields: [
      { key: 'stompRadius', label: '范围半径', unit: 'px', min: 1, step: 1 },
      { key: 'stompDamage', label: '伤害', unit: '', min: 0, step: 0.5 },
    ],
  },
  {
    title: '陨石雨',
    fields: [
      { key: 'meteorInterval', label: '生成间隔', unit: '秒', min: 0.5, step: 0.5 },
      { key: 'meteorDamage', label: '爆炸伤害', unit: '', min: 0, step: 0.5 },
      { key: 'meteorExplodeRadius', label: '爆炸半径', unit: 'px', min: 1, step: 1 },
      { key: 'meteorSpawnRadius', label: '落点散布半径', unit: 'px', min: 1, step: 1 },
      { key: 'meteorFallDuration', label: '下落时长', unit: '秒', min: 0.1, step: 0.05 },
    ],
  },
  {
    title: '岩浆',
    fields: [
      { key: 'lavaRadius', label: '范围半径', unit: 'px', min: 1, step: 1 },
      { key: 'lavaDuration', label: '持续时间', unit: '秒', min: 1, step: 1 },
      { key: 'lavaDps', label: '每秒伤害', unit: '', min: 0, step: 0.5 },
    ],
  },
  {
    title: '动画',
    fields: [
      { key: 'meleeAnimDuration', label: '近战动作时长', unit: '秒', min: 0.1, step: 0.05 },
    ],
  },
]

export function applyLuxToDef(
  patchMonsterDef: (id: string, patch: Record<string, unknown>) => void,
  cfg: LuxConfig,
) {
  patchMonsterDef(MONSTER_ID, {
    hp: cfg.hp,
    attack: cfg.attack,
    armor: cfg.armor,
    moveSpeed: cfg.moveSpeed,
    attackInterval: cfg.attackInterval,
    attackRange: cfg.meleeRange,
    radius: cfg.radius,
  })
}

let runtimeConfig = luxDefaults()

export function getLuxConfig(): LuxConfig {
  return runtimeConfig
}

export function setLuxConfig(cfg: LuxConfig) {
  runtimeConfig = cfg
}
