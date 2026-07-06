import { useCallback, useEffect, useMemo, useState } from 'react'
import { BattleCanvas } from './components/BattleCanvas'
import { INITIAL_GOLD, MAX_UNITS_PER_TEAM, MONSTERS, MONSTER_MAP } from './data/monsters'
import { createBattleFromDeployments, createDeployId, stepBattle } from './game/battleEngine'
import type { DeployedUnit, GameState } from './game/types'

const FIELD_W = 960
const FIELD_H = 540
import { aiBuy, aiBuyTotal } from './game/aiShop'

function aiDeploy(team: 0 | 1, monsterIds: string[]): DeployedUnit[] {
  const cols = Math.min(monsterIds.length, 3)
  return monsterIds.map((monsterId, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = team === 0 ? 140 + col * 90 : FIELD_W - 140 - col * 90
    const y = 120 + row * 100 + (col % 2) * 20
    return { id: createDeployId(), monsterId, team, x, y }
  })
}

function createInitialState(): GameState {
  const aiPicks = aiBuy(INITIAL_GOLD)
  const aiCost = aiBuyTotal(aiPicks)
  return {
    phase: 'shop',
    gold: [INITIAL_GOLD, INITIAL_GOLD - aiCost],
    shop: aiPicks.map((p) => ({ monsterId: p.monsterId, team: 1 })),
    deployed: [],
    battle: null,
    winner: null,
  }
}

export default function App() {
  const [state, setState] = useState<GameState>(createInitialState)
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null)

  const playerUnits = useMemo(
    () => state.shop.filter((s) => s.team === 0),
    [state.shop],
  )

  const buyMonster = (monsterId: string) => {
    const def = MONSTER_MAP[monsterId]
    setState((prev) => {
      if (prev.phase !== 'shop') return prev
      const playerCount = prev.shop.filter((s) => s.team === 0).length
      if (playerCount >= MAX_UNITS_PER_TEAM) return prev
      if (prev.gold[0] < def.price) return prev
      return {
        ...prev,
        gold: [prev.gold[0] - def.price, prev.gold[1]],
        shop: [...prev.shop, { monsterId, team: 0 }],
      }
    })
  }

  const startDeploy = () => {
    if (playerUnits.length === 0) return
    setState((prev) => ({ ...prev, phase: 'deploy' }))
  }

  const placeUnit = useCallback(
    (x: number, y: number) => {
      if (!selectedMonster) return
      setState((prev) => {
        if (prev.phase !== 'deploy') return prev
        const idx = prev.shop.findIndex((s) => s.team === 0 && s.monsterId === selectedMonster)
        if (idx < 0) return prev
        if (x > FIELD_W / 2 - 30) return prev
        const nextShop = [...prev.shop]
        nextShop.splice(idx, 1)
        const deployed: DeployedUnit = {
          id: createDeployId(),
          monsterId: selectedMonster,
          team: 0,
          x,
          y,
        }
        return {
          ...prev,
          shop: nextShop,
          deployed: [...prev.deployed, deployed],
        }
      })
      setSelectedMonster(null)
    },
    [selectedMonster],
  )

  const startBattle = () => {
    setState((prev) => {
      const aiUnits = prev.shop.filter((s) => s.team === 1).map((s) => s.monsterId)
      const aiDeployed = aiDeploy(1, aiUnits)
      const allDeployed = [...prev.deployed, ...aiDeployed]
      return {
        ...prev,
        phase: 'battle',
        shop: [],
        deployed: allDeployed,
        battle: createBattleFromDeployments(allDeployed),
      }
    })
  }

  useEffect(() => {
    if (state.phase !== 'battle' || !state.battle || state.battle.winner !== null) return
    const timer = window.setInterval(() => {
      setState((prev) => {
        if (!prev.battle || prev.battle.winner !== null) return prev
        const next = stepBattle(prev.battle)
        if (next.winner !== null) {
          return { ...prev, battle: next, phase: 'result', winner: next.winner }
        }
        return { ...prev, battle: next }
      })
    }, 1000 / 30)
    return () => clearInterval(timer)
  }, [state.phase, state.battle?.winner])

  const reset = () => setState(createInitialState())

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state.phase !== 'deploy') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * FIELD_W
    const y = ((e.clientY - rect.top) / rect.height) * FIELD_H
    placeUnit(x, y)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>MC Fight Arena</h1>
        <div className="gold-bar">
          <span>我方金币: {state.gold[0]}</span>
          <span>敌方金币: {state.gold[1]}</span>
        </div>
      </header>

      {state.phase === 'shop' && (
        <section className="shop">
          <h2>选购怪物（最多 {MAX_UNITS_PER_TEAM} 只）</h2>
          <p>已选 {playerUnits.length} 只 · 电脑已选好敌方阵容</p>
          <div className="monster-grid">
            {MONSTERS.map((m) => (
              <button
                key={m.id}
                className="monster-card"
                disabled={state.gold[0] < m.price || playerUnits.length >= MAX_UNITS_PER_TEAM}
                onClick={() => buyMonster(m.id)}
              >
                <img src={`/assets/monsters/${m.id}/idle.png`} alt={m.name} />
                <strong>{m.name}</strong>
                <span>{m.price}G</span>
                <small>{m.hp}HP / {m.attack}ATK</small>
              </button>
            ))}
          </div>
          <div className="picked-list">
            <h3>我方阵容</h3>
            {playerUnits.map((u, i) => (
              <span key={`${u.monsterId}-${i}`}>{MONSTER_MAP[u.monsterId].name}</span>
            ))}
          </div>
          <button className="primary" disabled={playerUnits.length === 0} onClick={startDeploy}>
            进入部署
          </button>
        </section>
      )}

      {state.phase === 'deploy' && (
        <section className="deploy">
          <h2>部署阶段 — 点击左侧半场放置怪物</h2>
          <div className="deploy-layout">
            <div className="deploy-pool">
              {state.shop.filter((s) => s.team === 0).map((s, i) => (
                <button
                  key={`${s.monsterId}-${i}`}
                  className={selectedMonster === s.monsterId ? 'selected' : ''}
                  onClick={() => setSelectedMonster(s.monsterId)}
                >
                  {MONSTER_MAP[s.monsterId].name}
                </button>
              ))}
            </div>
            <div className="field-clickable" onClick={handleCanvasClick}>
              <DeployPreview deployed={state.deployed} />
            </div>
          </div>
          <button
            className="primary"
            disabled={state.shop.some((s) => s.team === 0)}
            onClick={startBattle}
          >
            开战！
          </button>
        </section>
      )}

      {(state.phase === 'battle' || state.phase === 'result') && state.battle && (
        <section className="battle">
          <BattleCanvas snapshot={state.battle} />
          {state.phase === 'result' && (
            <div className="result-overlay">
              <h2>{state.winner === 0 ? '我方胜利！' : '敌方胜利！'}</h2>
              <button className="primary" onClick={reset}>再来一局</button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function DeployPreview({ deployed }: { deployed: DeployedUnit[] }) {
  return (
    <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="deploy-preview">
      <rect width={FIELD_W} height={FIELD_H} fill="#3d5c2e" />
      <line x1={FIELD_W / 2} y1={0} x2={FIELD_W / 2} y2={FIELD_H} stroke="rgba(255,255,255,0.35)" strokeDasharray="8 8" />
      {deployed.map((d) => (
        <g key={d.id}>
          <circle cx={d.x} cy={d.y} r={16} fill={d.team === 0 ? '#4a9eff' : '#ff6b4a'} />
          <text x={d.x} y={d.y + 4} textAnchor="middle" fill="#fff" fontSize="10">
            {MONSTER_MAP[d.monsterId].name.slice(0, 1)}
          </text>
        </g>
      ))}
    </svg>
  )
}
