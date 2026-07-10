import type { MonsterModule } from './types'
import { tremorzillaModule } from './alexscaves_tremorzilla'
import { luxtructosaurusModule } from './alexscaves_luxtructosaurus'
import { ancientRemnantModule } from './cataclysm_ancient_remnant'
import { harbingerModule } from './cataclysm_the_harbinger'
import { wadjetModule } from './cataclysm_wadjet'
import { wardenModule } from './warden'
import { kobolediatorModule } from './cataclysm_kobolediator'
import { atlatitanModule } from './alexscaves_atlatitan'
import { tremorsaurusModule } from './alexscaves_tremorsaurus'
import { enderGolemModule } from './cataclysm_ender_golem'
import { warpedMoscoModule } from './alexsmobs_warped_mosco'
import { cyclopsModule } from './iceandfire_cyclops'
import { amethystCrabModule } from './cataclysm_amethyst_crab'
import { ignitedRevenantModule } from './cataclysm_ignited_revenant'
import { coralGolemModule } from './cataclysm_coral_golem'
import { coralssusModule } from './cataclysm_coralssus'
import { forsakenModule } from './alexscaves_forsaken'

const IMPLEMENTED_MODULES: MonsterModule[] = [
  tremorzillaModule,
  luxtructosaurusModule,
  ancientRemnantModule,
  harbingerModule,
  wardenModule,
  wadjetModule,
  kobolediatorModule,
  atlatitanModule,
  tremorsaurusModule,
  enderGolemModule,
  warpedMoscoModule,
  cyclopsModule,
  amethystCrabModule,
  ignitedRevenantModule,
  coralGolemModule,
  coralssusModule,
  forsakenModule,
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
