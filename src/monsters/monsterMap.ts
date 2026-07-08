import type { MonsterDef } from '../game/types'

/** 运行时怪物表（由 monsters/index 初始化，避免循环依赖） */
export const MONSTERS: MonsterDef[] = []
export const MONSTER_MAP: Record<string, MonsterDef> = {}

export function registerMonsterCatalog(list: MonsterDef[]) {
  MONSTERS.length = 0
  MONSTERS.push(...list)
  for (const key of Object.keys(MONSTER_MAP)) delete MONSTER_MAP[key]
  for (const def of list) MONSTER_MAP[def.id] = def
}
