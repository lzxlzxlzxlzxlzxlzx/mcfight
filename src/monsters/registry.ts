import type { MonsterModule } from './types'
import { tremorzillaModule } from './alexscaves_tremorzilla'
import { luxtructosaurusModule } from './alexscaves_luxtructosaurus'
import { ancientRemnantModule } from './cataclysm_ancient_remnant'
import { harbingerModule } from './cataclysm_the_harbinger'
import { wadjetModule } from './cataclysm_wadjet'
import { wardenModule } from './warden'
import { kobolediatorModule } from './cataclysm_kobolediator'

const IMPLEMENTED_MODULES: MonsterModule[] = [
  tremorzillaModule,
  luxtructosaurusModule,
  ancientRemnantModule,
  harbingerModule,
  wardenModule,
  wadjetModule,
  kobolediatorModule,
]

const byId = new Map<string, MonsterModule>()
for (const mod of IMPLEMENTED_MODULES) byId.set(mod.id, mod)

export function getMonsterModule(id: string): MonsterModule | undefined {
  return byId.get(id)
}

export function getImplementedMonsterModules(): MonsterModule[] {
  return [...IMPLEMENTED_MODULES]
}

export function getConfigurableMonsterIds(): string[] {
  return IMPLEMENTED_MODULES.filter((m) => m.configurable).map((m) => m.id)
}

export { IMPLEMENTED_MODULES }
