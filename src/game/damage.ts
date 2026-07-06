/**
 * Minecraft Java Edition 护甲减伤（CombatRules.getDamageAfterAbsorb）
 *
 * g = clamp(armor - 4*damage/(toughness+8), armor/5, 20)
 * finalDamage = damage * (1 - g/25)
 *
 * 最大减伤 80%（g 上限 20）
 */
export function getDamageAfterArmor(
  damage: number,
  armorPoints: number,
  armorToughness = 0,
): number {
  if (damage <= 0) return 0
  if (armorPoints <= 0) return damage

  const g = Math.min(
    20,
    Math.max(armorPoints / 5, armorPoints - (4 * damage) / (armorToughness + 8)),
  )
  return damage * (1 - g / 25)
}
