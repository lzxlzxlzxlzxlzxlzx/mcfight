import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const ignitedRevenantModule: MonsterModule = {
  id: ID,
  name: '炽燃遗魂',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
