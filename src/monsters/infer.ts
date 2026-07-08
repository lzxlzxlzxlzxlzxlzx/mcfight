import type { MonsterDef, StatusEffectType } from '../game/types'

export type RawMonsterRow = [string, number, string, string, string, string, string]

export function parseAttack(raw: string): number {
  const nums = raw.match(/[\d.]+/g)?.map(Number) ?? [5]
  if (nums.length >= 2) return (nums[0] + nums[1]) / 2
  return nums[0]
}

export function parseHp(raw: string): number {
  const nums = raw.match(/[\d.]+/g)?.map(Number) ?? [50]
  if (nums.length >= 2) return (nums[0] + nums[1]) / 2
  return nums[0]
}

export function inferMoveType(desc: string): 'ground' | 'fly' {
  return desc.includes('飞行') ? 'fly' : 'ground'
}

export function inferAttackType(desc: string, attack: number): 'melee' | 'ranged' {
  if (desc.includes('远程') || desc.includes('射击') || desc.includes('投掷') || desc.includes('射线') || desc.includes('吐息')) {
    return 'ranged'
  }
  if (attack <= 6 && (desc.includes('激光') || desc.includes('药水'))) return 'ranged'
  return 'melee'
}

export function inferOnHitEffects(desc: string): StatusEffectType[] {
  const effects: StatusEffectType[] = []
  if (/中毒|毒性|剧毒|毒液|辐照/.test(desc)) effects.push('poison')
  if (/火焰|烈焰|点燃/.test(desc)) effects.push('burn')
  if (/凋零/.test(desc)) effects.push('wither')
  if (/减速|迟缓|寒冰|冰雪|冰冻|控制/.test(desc)) effects.push('slow')
  return effects
}

export function inferTags(desc: string, unitId: string): string[] {
  const tags: string[] = []
  if (desc.includes('boss') || desc.includes('Boss')) tags.push('boss')
  if (desc.includes('飞行')) tags.push('fly')
  if (desc.includes('节肢') || unitId.includes('spider') || unitId.includes('beetle') || unitId.includes('centipede')) {
    tags.push('arthropod')
  }
  if (desc.includes('自爆')) tags.push('explosive')
  if (desc.includes('召唤')) tags.push('summoner')
  if (desc.includes('范围攻击')) tags.push('aoe_melee')
  if (desc.includes('陨石雨')) tags.push('meteor_passive')
  if (desc.includes('火焰免疫') || /岩浆|陨石雨/.test(desc)) tags.push('fire_immune')
  return tags
}

export function buildMonster(
  name: string,
  price: number,
  desc: string,
  hpRaw: string,
  atkRaw: string,
  armorRaw: string,
  unitId: string,
): MonsterDef {
  const hp = parseHp(hpRaw)
  const attack = parseAttack(atkRaw)
  const armor = armorRaw.trim() ? Number(armorRaw) || 0 : 0
  const moveType = inferMoveType(desc)
  const attackType = inferAttackType(desc, attack)
  const isBoss = desc.toLowerCase().includes('boss')
  const isGiant = unitId === 'alexscaves:tremorzilla'
    || unitId === 'alexscaves:luxtructosaurus'
    || unitId === 'cataclysm:ancient_remnant'
  const isRanged = attackType === 'ranged'

  return {
    id: unitId.replace(':', '_'),
    name,
    price,
    description: desc,
    hp,
    attack,
    armor,
    unitId,
    moveType,
    attackType,
    attackRange: isRanged ? (isBoss ? 220 : 160) : 42,
    moveSpeed: moveType === 'fly' ? 72 : isBoss ? 48 : 58,
    attackInterval: isRanged ? 1.1 : 0.85,
    radius: isGiant ? 56 : isBoss ? 28 : moveType === 'fly' ? 16 : 18,
    tags: inferTags(desc, unitId),
    onHitEffects: inferOnHitEffects(desc),
  }
}

export function createDefFromRaw(row: RawMonsterRow): MonsterDef {
  return buildMonster(...row)
}
