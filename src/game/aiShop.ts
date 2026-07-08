import { MONSTERS } from '../data/monsters'
import type { MonsterDef } from '../game/types'

export interface AiPick {
  monsterId: string
  cost: number
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 单次随机选购：在预算内随机挑怪，再用 DP 尽量清零余钱 */
function aiBuyOnce(gold: number, pool: MonsterDef[]): AiPick[] {
  const picks: AiPick[] = []
  let budget = gold
  const minPrice = Math.min(...pool.map((m) => m.price))

  while (budget >= minPrice) {
    const affordable = pool.filter((m) => m.price <= budget)
    if (affordable.length === 0) break
    const m = pickRandom(affordable)
    picks.push({ monsterId: m.id, cost: m.price })
    budget -= m.price
  }

  if (budget > 0) {
    for (const m of spendExact(budget, pool)) {
      picks.push({ monsterId: m.id, cost: m.price })
    }
  }

  return picks
}

/** 确定性兜底：优先买贵怪，保证能花光金币 */
function aiBuyDeterministic(gold: number): AiPick[] {
  const picks: AiPick[] = []
  let budget = gold
  const byPriceDesc = [...MONSTERS].sort((a, b) => b.price - a.price)
  const minPrice = [...MONSTERS].sort((a, b) => a.price - b.price)[0]?.price ?? 1

  while (budget >= minPrice) {
    const m = byPriceDesc.find((x) => x.price <= budget)
    if (!m) break
    picks.push({ monsterId: m.id, cost: m.price })
    budget -= m.price
  }

  if (budget > 0) {
    for (const m of spendExact(budget, MONSTERS)) {
      picks.push({ monsterId: m.id, cost: m.price })
    }
  }

  return picks
}

/** AI 选购：每局随机阵容，尽量花光金币 */
export function aiBuy(gold: number): AiPick[] {
  const attempts = 32
  const perfect: AiPick[][] = []

  for (let i = 0; i < attempts; i++) {
    const picks = aiBuyOnce(gold, shuffle(MONSTERS))
    if (aiBuyTotal(picks) === gold) perfect.push(picks)
  }

  if (perfect.length > 0) {
    return pickRandom(perfect)
  }

  let best = aiBuyDeterministic(gold)
  let bestRemainder = gold - aiBuyTotal(best)

  for (let i = 0; i < attempts; i++) {
    const picks = aiBuyOnce(gold, shuffle(MONSTERS))
    const remainder = gold - aiBuyTotal(picks)
    if (remainder < bestRemainder) {
      best = picks
      bestRemainder = remainder
      if (remainder === 0) break
    }
  }

  return best
}

/** 用动态规划把剩余金币凑到 0（允许重复购买，怪物顺序影响解） */
function spendExact(amount: number, pool: MonsterDef[]) {
  if (amount <= 0) return []

  const dp = Array.from({ length: amount + 1 }, () => -1)
  const choice = Array.from({ length: amount + 1 }, () => null as MonsterDef | null)
  dp[0] = 0

  for (let s = 0; s <= amount; s++) {
    if (dp[s] < 0) continue
    for (const m of pool) {
      const next = s + m.price
      if (next <= amount && dp[next] < dp[s] + 1) {
        dp[next] = dp[s] + 1
        choice[next] = m
      }
    }
  }

  if (dp[amount] < 0) return []

  const result: MonsterDef[] = []
  let cur = amount
  while (cur > 0 && choice[cur]) {
    const m = choice[cur]!
    result.push(m)
    cur -= m.price
  }
  return result
}

export function aiBuyTotal(picks: AiPick[]) {
  return picks.reduce((s, p) => s + p.cost, 0)
}
