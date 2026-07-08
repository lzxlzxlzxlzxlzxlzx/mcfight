import type { MonsterModule } from '../types'
import { ID, createDef } from './def'
import { LUX_SKILL_GROUPS } from './config'

export const luxtructosaurusModule: MonsterModule = {
  id: ID,
  name: '暝煌龙',
  createDef,
  skillGroups: LUX_SKILL_GROUPS,
  configurable: true,
}

export * from './def'
export * from './config'
export * from './abilities'
