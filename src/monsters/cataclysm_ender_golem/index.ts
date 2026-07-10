import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const enderGolemModule: MonsterModule = {
  id: ID,
  name: '末影傀儡',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
