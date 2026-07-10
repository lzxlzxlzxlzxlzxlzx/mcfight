import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const cyclopsModule: MonsterModule = {
  id: ID,
  name: '独眼巨人',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
