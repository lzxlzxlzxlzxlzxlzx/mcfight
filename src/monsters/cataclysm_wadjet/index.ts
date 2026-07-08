import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const wadjetModule: MonsterModule = {
  id: ID,
  name: '瓦吉特',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
