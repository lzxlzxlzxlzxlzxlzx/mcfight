import { useCallback, useEffect, useMemo, useState } from 'react'
import { BattleCanvas } from './components/BattleCanvas'
import { MonsterConfigPanel } from './components/MonsterConfigPanel'
import { BULK_BUY_COUNT, INITIAL_GOLD, MONSTERS, MONSTER_MAP } from './data/monsters'
import { getUnitVisualHalfExtent } from './game/field'
import { createBattleFromDeployments, createDeployId, stepBattle } from './game/battleEngine'
import type { DeployedUnit, GameState } from './game/types'

const FIELD_W = 960
const FIELD_H = 540

function createInitialState(): GameState {
  return {
    phase: 'shop',
    gold: [INITIAL_GOLD, INITIAL_GOLD],
    shop: [],
    deployed: [],
    battle: null,
    winner: null,
  }
}

function summarizeUnits(units: { monsterId: string }[]) {
  const counts = new Map<string, number>()
  for (const u of units) counts.set(u.monsterId, (counts.get(u.monsterId) ?? 0) + 1)
  return [...counts.entries()].map(([id, n]) => ({
    monsterId: id,
    name: MONSTER_MAP[id].name,
    count: n,
  }))
}

export default function App() {
  const [view, setView] = useState<'game' | 'config'>('game')
  const [state, setState] = useState<GameState>(createInitialState)
  const [activeTeam, setActiveTeam] = useState<0 | 1>(0)
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null)

  const team0Pool = useMemo(() => state.shop.filter((s) => s.team === 0), [state.shop])
  const team1Pool = useMemo(() => state.shop.filter((s) => s.team === 1), [state.shop])
  const activePool = activeTeam === 0 ? team0Pool : team1Pool

  const team0Summary = useMemo(() => summarizeUnits(team0Pool), [team0Pool])
  const team1Summary = useMemo(() => summarizeUnits(team1Pool), [team1Pool])
  const activeSummary = activeTeam === 0 ? team0Summary : team1Summary

  const buyMonster = (monsterId: string, count: number) => {
    const def = MONSTER_MAP[monsterId]
    setState((prev) => {
      if (prev.phase !== 'shop') return prev
      let gold = prev.gold[activeTeam]
      const newUnits: GameState['shop'] = []
      for (let i = 0; i < count; i++) {
        if (gold < def.price) break
        gold -= def.price
        newUnits.push({ id: createDeployId(), monsterId, team: activeTeam })
      }
      if (newUnits.length === 0) return prev
      const nextGold: [number, number] = [...prev.gold] as [number, number]
      nextGold[activeTeam] = gold
      return {
        ...prev,
        gold: nextGold,
        shop: [...prev.shop, ...newUnits],
      }
    })
  }

  const canStartDeploy = team0Pool.length > 0 && team1Pool.length > 0

  const startDeploy = () => {
    if (!canStartDeploy) return
    setState((prev) => ({ ...prev, phase: 'deploy' }))
    setActiveTeam(0)
    setSelectedMonsterId(null)
  }

  const placeUnit = useCallback(
    (x: number, y: number) => {
      if (!selectedMonsterId) return
      const onLeft = x <= FIELD_W / 2 - 30
      const onRight = x >= FIELD_W / 2 + 30
      if (activeTeam === 0 && !onLeft) return
      if (activeTeam === 1 && !onRight) return

      setState((prev) => {
        if (prev.phase !== 'deploy') return prev
        const shopIndex = prev.shop.findIndex(
          (s) => s.team === activeTeam && s.monsterId === selectedMonsterId,
        )
        if (shopIndex < 0) return prev

        const unit = prev.shop[shopIndex]
        const nextShop = [...prev.shop]
        nextShop.splice(shopIndex, 1)

        const def = MONSTER_MAP[unit.monsterId]
        const half = getUnitVisualHalfExtent(def?.tags ?? [])
        const cx = Math.max(half, Math.min(FIELD_W - half, x))
        const cy = Math.max(half, Math.min(FIELD_H - half, y))

        const deployed: DeployedUnit = {
          id: createDeployId(),
          monsterId: unit.monsterId,
          team: activeTeam,
          x: cx,
          y: cy,
        }

        const hasMore = nextShop.some(
          (s) => s.team === activeTeam && s.monsterId === unit.monsterId,
        )
        setSelectedMonsterId(hasMore ? unit.monsterId : null)

        return {
          ...prev,
          shop: nextShop,
          deployed: [...prev.deployed, deployed],
        }
      })
    },
    [selectedMonsterId, activeTeam],
  )

  const allDeployed = team0Pool.length === 0 && team1Pool.length === 0

  const startBattle = () => {
    if (!allDeployed) return
    setState((prev) => ({
      ...prev,
      phase: 'battle',
      shop: [],
      battle: createBattleFromDeployments(prev.deployed),
    }))
    setSelectedMonsterId(null)
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

  const reset = () => {
    setState(createInitialState())
    setActiveTeam(0)
    setSelectedMonsterId(null)
  }

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
        <div className="header-actions">
          <nav className="view-tabs">
            <button
              type="button"
              className={view === 'game' ? 'active' : ''}
              onClick={() => setView('game')}
            >
              对战
            </button>
            <button
              type="button"
              className={view === 'config' ? 'active' : ''}
              onClick={() => setView('config')}
            >
              数值配置
            </button>
          </nav>
          {view === 'game' && (
            <div className="gold-bar">
              <span className="team-gold team0">蓝方金币: {state.gold[0]}</span>
              <span className="team-gold team1">红方金币: {state.gold[1]}</span>
            </div>
          )}
        </div>
      </header>

      {view === 'config' && <MonsterConfigPanel />}

      {view === 'game' && state.phase === 'shop' && (
        <section className="shop">
          <h2>选购怪物（双方各自用金币购买）</h2>
          <TeamSwitcher team={activeTeam} onChange={setActiveTeam} />
          <p>
            当前配置 <strong>{activeTeam === 0 ? '蓝方' : '红方'}</strong>
            ，已选 {activePool.length} 只
          </p>
          <div className="monster-grid">
            {MONSTERS.map((m) => {
              const gold = state.gold[activeTeam]
              const canAfford = gold >= m.price
              const maxBatch = Math.min(BULK_BUY_COUNT, Math.floor(gold / m.price))
              return (
                <div key={m.id} className={`monster-card${canAfford ? '' : ' disabled'}`}>
                  <img src={`/assets/monsters/${m.id}/idle.png`} alt={m.name} />
                  <strong>{m.name}</strong>
                  <span>{m.price}G</span>
                  <small>{m.hp}HP / {m.attack}ATK</small>
                  <div className="buy-actions">
                    <button type="button" disabled={!canAfford} onClick={() => buyMonster(m.id, 1)}>
                      +1
                    </button>
                    <button
                      type="button"
                      disabled={maxBatch <= 0}
                      onClick={() => buyMonster(m.id, maxBatch)}
                    >
                      +{maxBatch > 0 ? maxBatch : BULK_BUY_COUNT}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="picked-list dual">
            <div>
              <h3>蓝方阵容</h3>
              {team0Summary.length === 0 && <span className="empty-pick">未选购</span>}
              {team0Summary.map((g) => (
                <span key={g.monsterId} className="pick-tag team0">{g.name}×{g.count}</span>
              ))}
            </div>
            <div>
              <h3>红方阵容</h3>
              {team1Summary.length === 0 && <span className="empty-pick">未选购</span>}
              {team1Summary.map((g) => (
                <span key={g.monsterId} className="pick-tag team1">{g.name}×{g.count}</span>
              ))}
            </div>
          </div>
          <button className="primary" disabled={!canStartDeploy} onClick={startDeploy}>
            进入部署
          </button>
          {!canStartDeploy && (
            <p className="phase-hint">蓝方与红方各至少选购 1 只怪物后可部署</p>
          )}
        </section>
      )}

      {view === 'game' && state.phase === 'deploy' && (
        <section className="deploy">
          <h2>部署阶段 — 切换阵营后点击对应半场放置</h2>
          <TeamSwitcher team={activeTeam} onChange={(t) => { setActiveTeam(t); setSelectedMonsterId(null) }} />
          <p className="deploy-hint">
            正在部署 <strong className={activeTeam === 0 ? 'team0' : 'team1'}>{activeTeam === 0 ? '蓝方（左半场）' : '红方（右半场）'}</strong>
            ，剩余 {activePool.length} 只待放
          </p>
          <div className="deploy-layout">
            <div className={`deploy-pool ${activeTeam === 1 ? 'enemy-pool' : ''}`}>
              {activeSummary.length === 0 && <span className="empty-pick">该阵营已放完</span>}
              {activeSummary.map((g) => (
                <button
                  key={g.monsterId}
                  className={selectedMonsterId === g.monsterId ? 'selected' : ''}
                  onClick={() => setSelectedMonsterId(g.monsterId)}
                >
                  {g.name}×{g.count}
                </button>
              ))}
            </div>
            <div className="field-clickable" onClick={handleCanvasClick}>
              <DeployPreview deployed={state.deployed} activeTeam={activeTeam} />
            </div>
          </div>
          <div className="deploy-status">
            <span>蓝方待放: {team0Pool.length}</span>
            <span>红方待放: {team1Pool.length}</span>
          </div>
          <button className="primary" disabled={!allDeployed} onClick={startBattle}>
            开战！
          </button>
        </section>
      )}

      {view === 'game' && (state.phase === 'battle' || state.phase === 'result') && state.battle && (
        <section className="battle">
          <BattleCanvas snapshot={state.battle} />
          {state.phase === 'result' && (
            <div className="result-overlay">
              <h2>{state.winner === 0 ? '蓝方胜利！' : '红方胜利！'}</h2>
              <button className="primary" onClick={reset}>再来一局</button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function TeamSwitcher({ team, onChange }: { team: 0 | 1; onChange: (t: 0 | 1) => void }) {
  return (
    <div className="team-switcher">
      <button
        type="button"
        className={`team-tab team0${team === 0 ? ' active' : ''}`}
        onClick={() => onChange(0)}
      >
        蓝方
      </button>
      <button
        type="button"
        className={`team-tab team1${team === 1 ? ' active' : ''}`}
        onClick={() => onChange(1)}
      >
        红方
      </button>
    </div>
  )
}

function DeployPreview({
  deployed,
  activeTeam,
}: {
  deployed: DeployedUnit[]
  activeTeam: 0 | 1
}) {
  return (
    <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="deploy-preview">
      <rect width={FIELD_W / 2} height={FIELD_H} fill="#2e4a38" />
      <rect x={FIELD_W / 2} width={FIELD_W / 2} height={FIELD_H} fill="#4a382e" />
      <line x1={FIELD_W / 2} y1={0} x2={FIELD_W / 2} y2={FIELD_H} stroke="rgba(255,255,255,0.35)" strokeDasharray="8 8" />
      <rect
        x={0}
        y={0}
        width={FIELD_W / 2 - 30}
        height={FIELD_H}
        fill={activeTeam === 0 ? 'rgba(74,158,255,0.12)' : 'transparent'}
        stroke={activeTeam === 0 ? 'rgba(74,158,255,0.45)' : 'transparent'}
        strokeDasharray="6 4"
      />
      <rect
        x={FIELD_W / 2 + 30}
        y={0}
        width={FIELD_W / 2 - 30}
        height={FIELD_H}
        fill={activeTeam === 1 ? 'rgba(255,107,74,0.12)' : 'transparent'}
        stroke={activeTeam === 1 ? 'rgba(255,107,74,0.45)' : 'transparent'}
        strokeDasharray="6 4"
      />
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
