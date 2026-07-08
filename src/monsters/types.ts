import type { MonsterDef } from '../game/types'
import type { ConfigGroupDef } from '../game/configTypes'

/** 已实现特殊机制的怪物模块 */
export interface MonsterModule {
  id: string
  name: string
  /** 从 RAW 行构建定义，可覆盖基础推断属性 */
  createDef: () => MonsterDef
  /** 调试面板技能分组（无则仅基础属性） */
  skillGroups?: ConfigGroupDef[]
  /** 是否出现在配置面板 */
  configurable?: boolean
}
