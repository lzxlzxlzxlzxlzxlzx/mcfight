import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const coralGolemModule: MonsterModule = {
  id: ID,
  name: '珊瑚傀儡',
  createDef,
}

export * from './def'
export * from './config'
