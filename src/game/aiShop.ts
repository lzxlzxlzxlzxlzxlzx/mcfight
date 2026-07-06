import { MAX_UNITS_PER_TEAM, MONSTERS } from '../data/monsters'

export interface AiPick {
  monsterId: string
  cost: number
}

/** AI 选购：尽量买强力单位，剩余金币用便宜怪填满，目标零余钱 */
export function aiBuy(gold: number): AiPick[] {
  const picks: AiPick[] = []
  let budget = gold

  const byPriceDesc = [...MONSTERS].sort((a, b) => b.price - a.price)
  const byPriceAsc = [...MONSTERS].sort((a, b) => a.price - b.price)
  const minPrice = byPriceAsc[0]?.price ?? 1

  // 第一轮：在数量上限内优先买贵的
  while (picks.length < MAX_UNITS_PER_TEAM && budget >= minPrice) {
    const m = byPriceDesc.find((x) => x.price <= budget)
    if (!m) break
    picks.push({ monsterId: m.id, cost: m.price })
    budget -= m.price
  }

  // 第二轮：不受数量限制，用能买的最贵单位把余钱花光
  while (budget >= minPrice) {
    const m = byPriceDesc.find((x) => x.price <= budget)
    if (!m) break
    picks.push({ monsterId: m.id, cost: m.price })
    budget -= m.price
  }

  // 若仍有余钱（凑不齐整价），尝试用更小的单位精确清零
  if (budget > 0) {
    const exact = spendExact(budget)
    for (const m of exact) {
      picks.push({ monsterId: m.id, cost: m.price })
    }
  }

  return picks
}

/** 用动态规划把剩余金币凑到 0（允许重复购买） */
function spendExact(amount: number) {
  if (amount <= 0) return []

  const dp = Array.from({ length: amount + 1 }, () => -1)
  const choice = Array.from({ length: amount + 1 }, () => null as (typeof MONSTERS)[number] | null)
  dp[0] = 0

  for (let s = 0; s <= amount; s++) {
    if (dp[s] < 0) continue
    for (const m of MONSTERS) {
      const next = s + m.price
      if (next <= amount && dp[next] < dp[s] + 1) {
        dp[next] = dp[s] + 1
        choice[next] = m
      }
    }
  }

  if (dp[amount] < 0) return []

  const result: (typeof MONSTERS)[number][] = []
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
