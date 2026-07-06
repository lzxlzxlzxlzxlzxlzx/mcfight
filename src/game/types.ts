export type MoveType = 'ground' | 'fly'
export type AttackType = 'melee' | 'ranged'

export interface MonsterDef {
  id: string
  name: string
  price: number
  description: string
  hp: number
  attack: number
  armor: number
  unitId: string
  moveType: MoveType
  attackType: AttackType
  attackRange: number
  moveSpeed: number
  attackInterval: number
  radius: number
  armorToughness?: number
  tags: string[]
}

export type GamePhase = 'shop' | 'deploy' | 'battle' | 'result'

export interface ShopUnit {
  monsterId: string
  team: 0 | 1
}

export interface DeployedUnit {
  id: string
  monsterId: string
  team: 0 | 1
  x: number
  y: number
}

export interface BattleUnit {
  id: string
  monsterId: string
  team: 0 | 1
  x: number
  y: number
  hp: number
  maxHp: number
  attack: number
  armor: number
  moveType: MoveType
  attackType: AttackType
  attackRange: number
  moveSpeed: number
  attackInterval: number
  radius: number
  attackCooldown: number
  targetId: string | null
  state: 'idle' | 'chase' | 'attack' | 'dead'
  facing: 1 | -1
  attackAnimTimer: number
}

export interface Projectile {
  id: string
  team: 0 | 1
  x: number
  y: number
  targetId: string
  speed: number
  rawDamage: number
  sourceId: string
}

export interface BattleSnapshot {
  units: BattleUnit[]
  projectiles: Projectile[]
  tick: number
  winner: 0 | 1 | null
}

export interface GameState {
  phase: GamePhase
  gold: [number, number]
  shop: ShopUnit[]
  deployed: DeployedUnit[]
  battle: BattleSnapshot | null
  winner: 0 | 1 | null
}
