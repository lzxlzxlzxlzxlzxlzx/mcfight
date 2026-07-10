import { MONSTER_MAP } from '../data/monsters'
import { BATTLE_FIELD, getUnitVisualHalfExtent } from './field'
import type { DeployedUnit, ShopUnit } from './types'

const MID_GAP = 30
const PLACE_ATTEMPTS = 48

function getDeployZone(team: 0 | 1, half: number) {
  const { width, height } = BATTLE_FIELD
  const mid = width / 2
  if (team === 0) {
    return {
      minX: half,
      maxX: mid - MID_GAP - half,
      minY: half,
      maxY: height - half,
    }
  }
  return {
    minX: mid + MID_GAP + half,
    maxX: width - half,
    minY: half,
    maxY: height - half,
  }
}

function canPlaceAt(
  x: number,
  y: number,
  half: number,
  placed: DeployedUnit[],
): boolean {
  for (const p of placed) {
    const pHalf = getUnitVisualHalfExtent(MONSTER_MAP[p.monsterId]?.tags ?? [])
    const minDist = half + pHalf + 10
    if (Math.hypot(p.x - x, p.y - y) < minDist) return false
  }
  return true
}

function randomPointInZone(zone: ReturnType<typeof getDeployZone>) {
  return {
    x: zone.minX + Math.random() * (zone.maxX - zone.minX),
    y: zone.minY + Math.random() * (zone.maxY - zone.minY),
  }
}

/** 将商店中待放单位随机摆放到对应半场（可合并已有部署） */
export function buildRandomDeployments(
  shop: ShopUnit[],
  existing: DeployedUnit[] = [],
): DeployedUnit[] {
  const placed: DeployedUnit[] = existing.map((d) => ({ ...d }))
  const shuffled = [...shop].sort(() => Math.random() - 0.5)

  for (const unit of shuffled) {
    const def = MONSTER_MAP[unit.monsterId]
    const half = getUnitVisualHalfExtent(def?.tags ?? [])
    const zone = getDeployZone(unit.team, half)

    if (zone.maxX <= zone.minX || zone.maxY <= zone.minY) continue

    let x = zone.minX
    let y = zone.minY
    for (let i = 0; i < PLACE_ATTEMPTS; i++) {
      const p = randomPointInZone(zone)
      if (canPlaceAt(p.x, p.y, half, placed)) {
        x = p.x
        y = p.y
        break
      }
      if (i === PLACE_ATTEMPTS - 1) {
        x = p.x
        y = p.y
      }
    }

    placed.push({
      id: unit.id,
      monsterId: unit.monsterId,
      team: unit.team,
      x,
      y,
    })
  }

  return placed
}

export function canAutoDeploy(
  shop: ShopUnit[],
  deployed: DeployedUnit[],
): boolean {
  const hasTeam0 =
    shop.some((s) => s.team === 0) || deployed.some((d) => d.team === 0)
  const hasTeam1 =
    shop.some((s) => s.team === 1) || deployed.some((d) => d.team === 1)
  return hasTeam0 && hasTeam1 && (shop.length > 0 || deployed.length > 0)
}
