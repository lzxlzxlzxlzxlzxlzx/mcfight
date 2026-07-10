import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const tremorsaurusModule: MonsterModule = {
  id: ID,
  name: '撼地龙',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
