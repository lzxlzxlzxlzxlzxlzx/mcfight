export type MoveType = 'ground' | 'fly'
export type AttackType = 'melee' | 'ranged'
export type StatusEffectType = 'poison' | 'burn' | 'wither' | 'slow' | 'fear'

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
  /** 强制重选最近目标的倒计时 */
  retargetTimer: number
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
  /** 末影傀儡：技能释放定身剩余时间 */
  enderCastTimeLeft: number
  /** 撼地龙：恐吓怒吼 */
  tremorRoarCooldown: number
  tremorRoarTimeLeft: number
  /** 诡异蚊鬼：阶段 ground | frenzy */
  moscoPhase: 'ground' | 'frenzy'
  /** 吸血技能定身 */
  moscoCastTimeLeft: number
  /** 紫水晶巨蟹：埋地无敌 */
  crabBurrowTimeLeft: number
  crabCastTimeLeft: number
  crabPendingSkill: 'emerge' | 'sweep' | null
  /** 炽燃遗魂 */
  revenantCastTimeLeft: number
  revenantPendingSkill: 'spin' | 'breath' | 'bones' | null
  revenantTicksDone: number
  revenantAimAngle: number
  revenantAttackCooldown: number
  /** 遗弃者 */
  forsakenRegenAccum: number
  forsakenCastTimeLeft: number
  forsakenPendingSkill: 'bite' | 'hammer' | 'sonic' | 'ranged_sonic' | null
  forsakenTicksDone: number
  forsakenAimAngle: number
  forsakenLeapCooldown: number
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
  /** wave=海浪扩散动画，instant=瞬发扇形范围 */
  kind?: 'wave' | 'instant'
}

export interface VoidRuneEffect {
  id: string
  team: 0 | 1
  originX: number
  originY: number
  dirX: number
  dirY: number
  barLength: number
  barHalfWidth: number
  circleRadius: number
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

export type ProjectileKind = 'default' | 'harb_wither' | 'harb_homing' | 'harb_laser' | 'revenant_bone' | 'forsaken_sonic'

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
  /** 直线飞行方向（不追踪时可挡枪/躲避） */
  dirX?: number
  dirY?: number
  maxTravel?: number
  traveled?: number
  /** 穿透弹道已命中单位 */
  hitEnemyIds?: string[]
  pierceHalfWidth?: number
  /** 弧形声波：外弧半径与张角（弧度） */
  arcRadius?: number
  arcHalfRad?: number
}

export interface ForsakenArcWave {
  id: string
  team: 0 | 1
  sourceId: string
  sourceMonsterId: string
  /** 弧波前沿中心 */
  x: number
  y: number
  dirX: number
  dirY: number
  speed: number
  arcRadius: number
  arcHalfRad: number
  arcBandWidth: number
  damage: number
  hitEnemyIds: string[]
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
  forsakenArcWaves: ForsakenArcWave[]
  voidRunes: VoidRuneEffect[]
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
