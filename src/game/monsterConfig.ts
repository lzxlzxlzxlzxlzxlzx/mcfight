import type { MonsterDef } from './types'
import type { ConfigFieldDef, ConfigGroupDef } from './configTypes'
import {
  applyLuxToDef,
  luxDefaults,
  LUX_SKILL_GROUPS,
  setLuxConfig as syncLuxRuntime,
  type LuxConfig,
} from '../monsters/alexscaves_luxtructosaurus/config'
import {
  applyRemnantToDef,
  remnantDefaults,
  REMNANT_SKILL_GROUPS,
  setRemnantConfig as syncRemnantRuntime,
  type RemnantConfig,
} from '../monsters/cataclysm_ancient_remnant/config'
import {
  applyTremorToDef,
  getTremorBeamConfig as buildTremorBeamConfig,
  tremorDefaults,
  TREMOR_SKILL_GROUPS,
  setTremorConfig as syncTremorRuntime,
  type TremorConfig,
} from '../monsters/alexscaves_tremorzilla/config'
import {
  applyHarbingerToDef,
  harbingerDefaults,
  HARBINGER_SKILL_GROUPS,
  setHarbingerConfig as syncHarbingerRuntime,
  type HarbingerConfig,
} from '../monsters/cataclysm_the_harbinger/config'
import { getConfigurableMonsterIds, getMonsterModule } from '../monsters/registry'

export type { LuxConfig, TremorConfig, RemnantConfig, HarbingerConfig }
export type { ConfigFieldDef, ConfigGroupDef }

const STORAGE_KEY = 'mcfight-monster-config'
const CONFIG_VERSION = 3

let monsterMapRef: Record<string, MonsterDef> | null = null

export function registerMonsterMap(map: Record<string, MonsterDef>) {
  monsterMapRef = map
}

export interface BaseMonsterConfig {
  hp: number
  attack: number
  armor: number
  moveSpeed: number
  attackInterval: number
  attackRange: number
  radius: number
}

export interface MonsterConfigState {
  lux: LuxConfig
  tremor: TremorConfig
  remnant: RemnantConfig
  harbinger: HarbingerConfig
  base: Record<string, BaseMonsterConfig>
}

function baseDefaults(monsterId: string): BaseMonsterConfig {
  const def = monsterMapRef?.[monsterId]
  if (!def) {
    return { hp: 100, attack: 10, armor: 0, moveSpeed: 58, attackInterval: 0.85, attackRange: 42, radius: 18 }
  }
  return {
    hp: def.hp,
    attack: def.attack,
    armor: def.armor,
    moveSpeed: def.moveSpeed,
    attackInterval: def.attackInterval,
    attackRange: def.attackRange,
    radius: def.radius,
  }
}

export function listConfigurableMonsterIds(): string[] {
  return getConfigurableMonsterIds()
}

export type ConfigurableMonsterId = string

export const BASE_STAT_FIELDS: ConfigFieldDef[] = [
  { key: 'hp', label: '生命值', unit: 'HP', min: 1, step: 1 },
  { key: 'attack', label: '攻击力', unit: 'ATK', min: 0, step: 0.5 },
  { key: 'armor', label: '护甲', unit: '', min: 0, step: 1 },
  { key: 'moveSpeed', label: '移动速度', unit: 'px/s', min: 1, step: 1 },
  { key: 'attackInterval', label: '攻击间隔', unit: '秒', min: 0.1, step: 0.05 },
  { key: 'attackRange', label: '攻击距离', unit: 'px', min: 1, step: 1 },
  { key: 'radius', label: '碰撞半径', unit: 'px', min: 8, step: 1 },
]

export { LUX_SKILL_GROUPS, TREMOR_SKILL_GROUPS, REMNANT_SKILL_GROUPS, HARBINGER_SKILL_GROUPS }

function createDefaultState(): MonsterConfigState {
  return {
    lux: luxDefaults(),
    tremor: tremorDefaults(),
    remnant: remnantDefaults(),
    harbinger: harbingerDefaults(),
    base: {},
  }
}

let state: MonsterConfigState = createDefaultState()
const listeners = new Set<() => void>()

export function getMonsterConfigState(): MonsterConfigState {
  return state
}

export function subscribeMonsterConfig(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify() {
  for (const fn of listeners) fn()
}

function patchMonsterDef(monsterId: string, patch: Partial<MonsterDef>) {
  const def = monsterMapRef?.[monsterId]
  if (!def) return
  Object.assign(def, patch)
}

function applyLuxConfig(cfg: LuxConfig) {
  syncLuxRuntime(cfg)
  applyLuxToDef(patchMonsterDef, cfg)
}

function applyTremorConfig(cfg: TremorConfig) {
  syncTremorRuntime(cfg)
  applyTremorToDef(patchMonsterDef, cfg)
}

function applyRemnantConfig(cfg: RemnantConfig) {
  syncRemnantRuntime(cfg)
  applyRemnantToDef(patchMonsterDef, cfg)
}

function applyHarbingerConfig(cfg: HarbingerConfig) {
  syncHarbingerRuntime(cfg)
  applyHarbingerToDef(patchMonsterDef, cfg)
}

export function applyAllMonsterConfig() {
  applyLuxConfig(state.lux)
  applyTremorConfig(state.tremor)
  applyRemnantConfig(state.remnant)
  applyHarbingerConfig(state.harbinger)
}

export function updateLuxConfig(patch: Partial<LuxConfig>) {
  state = { ...state, lux: { ...state.lux, ...patch } }
  applyLuxConfig(state.lux)
  saveMonsterConfig()
  notify()
}

export function updateTremorConfig(patch: Partial<TremorConfig>) {
  state = { ...state, tremor: { ...state.tremor, ...patch } }
  applyTremorConfig(state.tremor)
  saveMonsterConfig()
  notify()
}

export function getLuxConfig(): LuxConfig {
  return state.lux
}

export function getTremorConfig(): TremorConfig {
  return state.tremor
}

export function getTremorBeamConfig() {
  return buildTremorBeamConfig(state.tremor)
}

export function resetLuxConfig() {
  state = { ...state, lux: luxDefaults() }
  applyLuxConfig(state.lux)
  saveMonsterConfig()
  notify()
}

export function resetTremorConfig() {
  state = { ...state, tremor: tremorDefaults() }
  applyTremorConfig(state.tremor)
  saveMonsterConfig()
  notify()
}

export function updateRemnantConfig(patch: Partial<RemnantConfig>) {
  state = { ...state, remnant: { ...state.remnant, ...patch } }
  applyRemnantConfig(state.remnant)
  saveMonsterConfig()
  notify()
}

export function getRemnantConfig(): RemnantConfig {
  return state.remnant
}

export function resetRemnantConfig() {
  state = { ...state, remnant: remnantDefaults() }
  applyRemnantConfig(state.remnant)
  saveMonsterConfig()
  notify()
}

export function updateHarbingerConfig(patch: Partial<HarbingerConfig>) {
  state = { ...state, harbinger: { ...state.harbinger, ...patch } }
  applyHarbingerConfig(state.harbinger)
  saveMonsterConfig()
  notify()
}

export function getHarbingerConfig(): HarbingerConfig {
  return state.harbinger
}

export function resetHarbingerConfig() {
  state = { ...state, harbinger: harbingerDefaults() }
  applyHarbingerConfig(state.harbinger)
  saveMonsterConfig()
  notify()
}

export function resetMonsterConfig(monsterId: ConfigurableMonsterId) {
  if (monsterId === 'alexscaves_luxtructosaurus') resetLuxConfig()
  else if (monsterId === 'alexscaves_tremorzilla') resetTremorConfig()
  else if (monsterId === 'cataclysm_ancient_remnant') resetRemnantConfig()
  else if (monsterId === 'cataclysm_the_harbinger') resetHarbingerConfig()
}

export function saveMonsterConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CONFIG_VERSION, ...state }))
  } catch {
    /* ignore quota errors */
  }
}

function normalizeRemnantConfig(raw: Record<string, unknown> | undefined): RemnantConfig {
  if (!raw) return remnantDefaults()
  const { stompConeDuration: _legacyStompDuration, ...rest } = raw
  return { ...remnantDefaults(), ...rest } as RemnantConfig
}

export function loadMonsterConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      applyAllMonsterConfig()
      return
    }
    const parsed = JSON.parse(raw) as Partial<MonsterConfigState> & { version?: number }
    state = {
      lux: { ...luxDefaults(), ...parsed.lux },
      tremor: { ...tremorDefaults(), ...parsed.tremor },
      remnant: normalizeRemnantConfig(parsed.remnant as Record<string, unknown> | undefined),
      harbinger: { ...harbingerDefaults(), ...parsed.harbinger },
      base: parsed.base ?? {},
    }
    applyAllMonsterConfig()
    if ((parsed.version ?? 0) < CONFIG_VERSION) saveMonsterConfig()
    notify()
  } catch {
    state = createDefaultState()
    applyAllMonsterConfig()
  }
}

export function getSkillGroupsFor(monsterId: string): ConfigGroupDef[] {
  return getMonsterModule(monsterId)?.skillGroups ?? []
}

export function getSkillValues(monsterId: string): Record<string, number> {
  if (monsterId === 'alexscaves_luxtructosaurus') return state.lux as unknown as Record<string, number>
  if (monsterId === 'alexscaves_tremorzilla') return state.tremor as unknown as Record<string, number>
  if (monsterId === 'cataclysm_ancient_remnant') return state.remnant as unknown as Record<string, number>
  if (monsterId === 'cataclysm_the_harbinger') return state.harbinger as unknown as Record<string, number>
  return {}
}

export function getBaseStatValues(monsterId: string): BaseMonsterConfig {
  if (monsterId === 'alexscaves_luxtructosaurus') {
    const c = state.lux
    return {
      hp: c.hp,
      attack: c.attack,
      armor: c.armor,
      moveSpeed: c.moveSpeed,
      attackInterval: c.attackInterval,
      attackRange: c.meleeRange,
      radius: c.radius,
    }
  }
  if (monsterId === 'alexscaves_tremorzilla') {
    const c = state.tremor
    const def = monsterMapRef?.[monsterId]
    return {
      hp: c.hp,
      attack: c.attack,
      armor: c.armor,
      moveSpeed: def?.moveSpeed ?? 48,
      attackInterval: c.attackInterval,
      attackRange: c.attackRange,
      radius: c.radius,
    }
  }
  if (monsterId === 'cataclysm_ancient_remnant') {
    const c = state.remnant
    return {
      hp: c.hp,
      attack: c.attack,
      armor: c.armor,
      moveSpeed: c.moveSpeed,
      attackInterval: c.attackInterval,
      attackRange: c.biteRange,
      radius: c.radius,
    }
  }
  if (monsterId === 'cataclysm_the_harbinger') {
    const c = state.harbinger
    return {
      hp: c.hp,
      attack: c.attack,
      armor: c.armor,
      moveSpeed: c.moveSpeed,
      attackInterval: c.witherMissileInterval,
      attackRange: c.attackRange,
      radius: c.radius,
    }
  }
  return state.base[monsterId] ?? baseDefaults(monsterId)
}

export function updateBaseStat(monsterId: string, key: keyof BaseMonsterConfig, value: number) {
  if (monsterId === 'alexscaves_luxtructosaurus') {
    const mapKey = key === 'attackRange' ? 'meleeRange' : key
    updateLuxConfig({ [mapKey]: value } as Partial<LuxConfig>)
    return
  }
  if (monsterId === 'alexscaves_tremorzilla') {
    if (key === 'moveSpeed') {
      patchMonsterDef(monsterId, { moveSpeed: value })
      saveMonsterConfig()
      notify()
      return
    }
    updateTremorConfig({ [key]: value } as Partial<TremorConfig>)
    return
  }
  if (monsterId === 'cataclysm_ancient_remnant') {
    const mapKey = key === 'attackRange' ? 'biteRange' : key
    updateRemnantConfig({ [mapKey]: value } as Partial<RemnantConfig>)
    return
  }
  if (monsterId === 'cataclysm_the_harbinger') {
    if (key === 'attackInterval') {
      updateHarbingerConfig({ witherMissileInterval: value, laserInterval: value })
      return
    }
    updateHarbingerConfig({ [key]: value } as Partial<HarbingerConfig>)
    return
  }
}

export function updateSkillValue(monsterId: string, key: string, value: number) {
  if (monsterId === 'alexscaves_luxtructosaurus') {
    updateLuxConfig({ [key]: value } as Partial<LuxConfig>)
    return
  }
  if (monsterId === 'alexscaves_tremorzilla') {
    updateTremorConfig({ [key]: value } as Partial<TremorConfig>)
    return
  }
  if (monsterId === 'cataclysm_ancient_remnant') {
    updateRemnantConfig({ [key]: value } as Partial<RemnantConfig>)
    return
  }
  if (monsterId === 'cataclysm_the_harbinger') {
    updateHarbingerConfig({ [key]: value } as Partial<HarbingerConfig>)
  }
}
