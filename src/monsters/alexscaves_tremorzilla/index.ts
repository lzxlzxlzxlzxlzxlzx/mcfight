import type { MonsterModule } from '../types'
import { ID, createDef } from './def'
import { TREMOR_SKILL_GROUPS } from './config'

export const tremorzillaModule: MonsterModule = {
  id: ID,
  name: '撼地斯拉',
  createDef,
  skillGroups: TREMOR_SKILL_GROUPS,
  configurable: true,
}

export * from './def'
export * from './config'
export * from './abilities'
