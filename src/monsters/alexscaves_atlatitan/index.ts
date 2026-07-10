import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const atlatitanModule: MonsterModule = {
  id: ID,
  name: '擎天龙',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
