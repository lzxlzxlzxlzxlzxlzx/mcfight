import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const warpedMoscoModule: MonsterModule = {
  id: ID,
  name: '诡异蚊鬼',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
