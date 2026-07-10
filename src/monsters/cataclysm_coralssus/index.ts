import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const coralssusModule: MonsterModule = {
  id: ID,
  name: '珊瑚巨兽',
  createDef,
}

export * from './def'
export * from './config'
