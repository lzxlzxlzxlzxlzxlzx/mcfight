import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const kobolediatorModule: MonsterModule = {
  id: ID,
  name: '骸骨斩首者',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
