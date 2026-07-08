export type MoveType = 'ground' | 'fly'
export type AttackType = 'melee' | 'ranged'
export type StatusEffectType = 'poison' | 'burn' | 'wither' | 'slow'

export interface StatusEffect {
  type: StatusEffectType
  remaining: number
  dotTimer: number
}

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
  onHitEffects: StatusEffectType[]
}

export type GamePhase = 'shop' | 'deploy' | 'battle' | 'result'

export interface ShopUnit {
  id: string
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
  statusEffects: StatusEffect[]
  vulnerableWindow: number
  baseMoveSpeed: number
  baseAttackInterval: number
  skillCooldown: number
  leapCooldown: number
  /** 暝煌龙：下次近战是否践踏（否则甩尾） */
  luxNextStomp: boolean
  meteorTimer: number
  leapTimeLeft: number
  leapFromX: number
  leapFromY: number
  leapToX: number
  leapToY: number
  /** 远古遗魂：技能施法剩余时间 */
  remnantCastTimeLeft: number
  remnantPendingSkill: 'bite' | 'tail' | 'sandstorm' | 'stomp' | 'obelisk' | null
  remnantQueuedSkill: 'bite' | 'tail' | 'sandstorm' | 'stomp' | 'obelisk' | null
  remnantObeliskCooldown: number
  /** 先驱者：生命回复累计 */
  harbRegenAccum: number
  harbAttackMode: 'wither_missile' | 'laser'
  harbModeTimer: number
  harbSkillTimer: number
  harbSkillIndex: number
  harbChargeTimeLeft: number
  harbChargeFromX: number
  harbChargeFromY: number
  harbChargeToX: number
  harbChargeToY: number
  harbChargeHits: Record<string, boolean>
  /** 攻击间隔内随机飘移方向与换向计时 */
  driftAngle: number
  driftTimer: number
  /** 瓦吉特：技能施法 */
  wadjetCastTimeLeft: number
  wadjetPendingSkill: 'sweep' | 'tornado' | 'obelisk' | null
  wadjetCycleSkill: 'sweep' | 'tornado'
  wadjetObeliskCooldown: number
  wadjetSweepStrikesDone: number
  wadjetCastAimAngle: number
  /** 骸骨斩首者 */
  koboCastTimeLeft: number
  koboPendingSkill: 'charge' | 'triple' | 'stomp' | null
  koboCycleSkill: 'triple' | 'stomp'
  koboChargeTimeLeft: number
  koboChargeFromX: number
  koboChargeFromY: number
  koboChargeToX: number
  koboChargeToY: number
  koboTripleStrikesDone: number
  koboCastAimAngle: number
}

export interface MeteorEffect {
  id: string
  team: 0 | 1
  sourceId: string
  x: number
  y: number
  fallProgress: number
  duration: number
  explodeRadius: number
  damage: number
}

export interface LavaPatch {
  id: string
  team: 0 | 1
  x: number
  y: number
  radius: number
  remaining: number
  dotTimer: number
}

export interface ShockwaveEffect {
  id: string
  team: 0 | 1
  x: number
  y: number
  maxRadius: number
  remaining: number
  duration: number
  kind?: 'default' | 'fire' | 'meteor' | 'sand'
}

export interface SandTornado {
  id: string
  team: 0 | 1
  sourceId: string
  orbitIndex: number
  orbitRadius: number
  angle: number
  angularSpeed: number
  hitRadius: number
  damage: number
  remaining: number
  hitCooldowns: Record<string, number>
}

export interface ObeliskBarrage {
  id: string
  team: 0 | 1
  sourceId: string
  cx: number
  cy: number
  maxRadius: number
  ringCount: number
  nextRingIndex: number
  ringTimer: number
  baseDamage: number
  pctMaxHp: number
  hitEnemyIds: string[]
  ringInterval: number
  fallDuration: number
  impactRadius: number
  spacing: number
}

export interface LinearSandTornado {
  id: string
  team: 0 | 1
  sourceId: string
  x: number
  y: number
  dirX: number
  dirY: number
  speed: number
  hitRadius: number
  damage: number
  hitEnemyIds: string[]
}

export interface FallingObelisk {
  id: string
  team: 0 | 1
  sourceId: string
  barrageId: string
  x: number
  y: number
  fallProgress: number
  duration: number
  impactRadius: number
  landed: boolean
  linger: number
}

export interface ConeStrikeEffect {
  id: string
  team: 0 | 1
  x: number
  y: number
  aimAngle: number
  maxLength: number
  angleDeg: number
  waveWidth: number
  /** 海浪外缘起始半径（纯动画） */
  startReach: number
  /** 海浪外缘当前半径（纯动画） */
  reach: number
  remaining: number
  duration: number
}

export interface ActiveBeam {
  id: string
  team: 0 | 1
  sourceId: string
  targetId: string
  originX: number
  originY: number
  dirX: number
  dirY: number
  length: number
  halfWidth: number
  remaining: number
  tickAccumulator: number
  ticksRemaining: number
  damagePerTick: number
  sourceMonsterId: string
  kind?: 'tremor' | 'harbinger_death'
  baseDamagePerTick?: number
  pctMaxHpPerTick?: number
  statusOnTick?: StatusEffectType[]
}

export type ProjectileKind = 'default' | 'harb_wither' | 'harb_homing' | 'harb_laser'

export interface Projectile {
  id: string
  team: 0 | 1
  x: number
  y: number
  targetId: string
  speed: number
  rawDamage: number
  sourceId: string
  sourceMonsterId: string
  kind?: ProjectileKind
  explodeRadius?: number
  statusOnHit?: StatusEffectType[]
  /** 追踪导弹初始/当前飞行方向 */
  dirX?: number
  dirY?: number
}

export interface BattleSnapshot {
  units: BattleUnit[]
  projectiles: Projectile[]
  shockwaves: ShockwaveEffect[]
  activeBeams: ActiveBeam[]
  meteors: MeteorEffect[]
  lavaPatches: LavaPatch[]
  sandTornados: SandTornado[]
  obeliskBarrages: ObeliskBarrage[]
  fallingObelisks: FallingObelisk[]
  coneStrikes: ConeStrikeEffect[]
  linearSandTornados: LinearSandTornado[]
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
