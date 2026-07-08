import type { MonsterModule } from '../types'
import { ID, createDef } from './def'
import { HARBINGER_SKILL_GROUPS } from './config'

export const harbingerModule: MonsterModule = {
  id: ID,
  name: '先驱者',
  createDef,
  skillGroups: HARBINGER_SKILL_GROUPS,
  configurable: true,
}

export * from './def'
export * from './config'
export * from './abilities'
