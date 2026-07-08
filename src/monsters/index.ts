import type { MonsterDef } from '../game/types'
import { registerMonsterCatalog, MONSTERS, MONSTER_MAP } from './monsterMap'
import { getImplementedMonsterModules } from './registry'
import { GENERIC_ENTRY_MODULES } from './entries'

function buildAllMonsters(): MonsterDef[] {
  const implemented = getImplementedMonsterModules()
  const implementedIds = new Set(implemented.map((m) => m.id))

  const generic = GENERIC_ENTRY_MODULES
    .filter((entry) => !implementedIds.has(entry.ID))
    .map((entry) => entry.createDef())

  const bosses = implemented.map((m) => m.createDef())

  // 保持与旧版 monsters.ts 相同的价格降序
  return [...bosses, ...generic].sort((a, b) => b.price - a.price)
}

registerMonsterCatalog(buildAllMonsters())

export { MONSTERS, MONSTER_MAP }
export { getMonsterModule, getImplementedMonsterModules, getConfigurableMonsterIds } from './registry'

export const INITIAL_GOLD = 1000
export const BULK_BUY_COUNT = 10

export function getMonsterAssetKey(monsterId: string): string {
  return monsterId
}

export function getMonsterSpriteUrl(monsterId: string, action: 'idle' | 'attack' | 'projectile' = 'idle'): string {
  return `/assets/monsters/${monsterId}/${action}.png`
}
