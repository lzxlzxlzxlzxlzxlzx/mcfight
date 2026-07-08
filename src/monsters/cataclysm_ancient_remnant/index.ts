import type { MonsterModule } from '../types'
import { ID, createDef } from './def'
import { REMNANT_SKILL_GROUPS } from './config'

export const ancientRemnantModule: MonsterModule = {
  id: ID,
  name: '远古遗魂',
  createDef,
  skillGroups: REMNANT_SKILL_GROUPS,
  configurable: true,
}

export * from './def'
export * from './config'
export * from './abilities'
