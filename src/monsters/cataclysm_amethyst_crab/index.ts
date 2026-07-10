import type { MonsterModule } from '../types'
import { ID, createDef } from './def'

export const amethystCrabModule: MonsterModule = {
  id: ID,
  name: '紫水晶巨蟹',
  createDef,
}

export * from './def'
export * from './config'
export * from './abilities'
