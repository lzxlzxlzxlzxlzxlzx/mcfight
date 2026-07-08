import type { ConfigGroupDef } from '../../game/configTypes'

export const MONSTER_ID = 'alexscaves_tremorzilla' as const

export interface TremorConfig {
  hp: number
  attack: number
  armor: number
  attackRange: number
  attackInterval: number
  radius: number
  aoeRadius: number
  aoeDamage: number
  beamCooldown: number
  beamDuration: number
  beamTicks: number
  beamDamagePerTick: number
  beamRange: number
  beamHalfWidth: number
  beamCastRange: number
}

export function tremorDefaults(): TremorConfig {
  const attack = 30
  return {
    hp: 500,
    attack,
    armor: 10,
    attackRange: 58,
    attackInterval: 1.0,
    radius: 56,
    aoeRadius: 92,
    aoeDamage: attack,
    beamCooldown: 30,
    beamDuration: 5,
    beamTicks: 15,
    beamDamagePerTick: 20,
    beamRange: 500,
    beamHalfWidth: 24,
    beamCastRange: 280,
  }
}

export const TREMOR_SKILL_GROUPS: ConfigGroupDef[] = [
  {
    title: '范围普攻',
    fields: [
      { key: 'aoeRadius', label: '冲击波半径', unit: 'px', min: 1, step: 1 },
      { key: 'aoeDamage', label: '伤害', unit: '', min: 0, step: 0.5 },
    ],
  },
  {
    title: '超能射线',
    fields: [
      { key: 'beamCooldown', label: '冷却', unit: '秒', min: 1, step: 1 },
      { key: 'beamDuration', label: '引导时长', unit: '秒', min: 0.5, step: 0.5 },
      { key: 'beamTicks', label: '伤害段数', unit: '次', min: 1, step: 1 },
      { key: 'beamDamagePerTick', label: '每段伤害', unit: '', min: 0, step: 0.5 },
      { key: 'beamRange', label: '射线长度', unit: 'px', min: 1, step: 1 },
      { key: 'beamHalfWidth', label: '射线半宽', unit: 'px', min: 1, step: 1 },
      { key: 'beamCastRange', label: '施法距离', unit: 'px', min: 1, step: 1 },
    ],
  },
]

export function applyTremorToDef(
  patchMonsterDef: (id: string, patch: Record<string, unknown>) => void,
  cfg: TremorConfig,
) {
  patchMonsterDef(MONSTER_ID, {
    hp: cfg.hp,
    attack: cfg.attack,
    armor: cfg.armor,
    attackRange: cfg.attackRange,
    attackInterval: cfg.attackInterval,
    radius: cfg.radius,
  })
}

export function getTremorBeamConfig(cfg: TremorConfig) {
  return {
    cooldown: cfg.beamCooldown,
    duration: cfg.beamDuration,
    ticks: cfg.beamTicks,
    damagePerTick: cfg.beamDamagePerTick,
    range: cfg.beamRange,
    halfWidth: cfg.beamHalfWidth,
    castRange: cfg.beamCastRange,
  }
}

let runtimeConfig = tremorDefaults()

export function getTremorConfig(): TremorConfig {
  return runtimeConfig
}

export function setTremorConfig(cfg: TremorConfig) {
  runtimeConfig = cfg
}
