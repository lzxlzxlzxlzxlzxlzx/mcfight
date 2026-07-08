import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const wardenModule: MonsterModule = {
  id: ID,
  name: '监守者',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
