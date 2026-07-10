import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const forsakenModule: MonsterModule = {
  id: ID,
  name: '遗弃者',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
