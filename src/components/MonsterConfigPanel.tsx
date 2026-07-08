import { useEffect, useState } from 'react'
import { MONSTER_MAP } from '../data/monsters'
import {
  BASE_STAT_FIELDS,
  getBaseStatValues,
  getSkillGroupsFor,
  getSkillValues,
  listConfigurableMonsterIds,
  resetMonsterConfig,
  subscribeMonsterConfig,
  updateBaseStat,
  updateSkillValue,
  type BaseMonsterConfig,
  type ConfigFieldDef,
  type ConfigurableMonsterId,
} from '../game/monsterConfig'

function ConfigNumberField({
  field,
  value,
  onChange,
}: {
  field: ConfigFieldDef
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="config-field">
      <span className="config-field-label">
        {field.label}
        {field.unit ? <small>（{field.unit}）</small> : null}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={field.min}
        step={field.step ?? 1}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n)) onChange(n)
        }}
      />
      {field.hint ? <small className="config-hint">{field.hint}</small> : null}
    </label>
  )
}

export function MonsterConfigPanel() {
  const configurableIds = listConfigurableMonsterIds()
  const [selectedId, setSelectedId] = useState<string>(configurableIds[0] ?? '')
  const [, bump] = useState(0)

  useEffect(() => subscribeMonsterConfig(() => bump((n) => n + 1)), [])

  const def = MONSTER_MAP[selectedId]
  if (!def || !selectedId) {
    return (
      <section className="config-panel">
        <p>暂无可配置的怪物模块。</p>
      </section>
    )
  }
  const baseStats = getBaseStatValues(selectedId)
  const skillGroups = getSkillGroupsFor(selectedId)
  const skillValues = getSkillValues(selectedId)

  const setBase = (key: keyof BaseMonsterConfig, value: number) => {
    updateBaseStat(selectedId, key, value)
  }

  return (
    <section className="config-panel">
      <div className="config-header">
        <h2>怪物数值配置</h2>
        <p>调整后自动保存到浏览器，新开一局战斗即生效。半径单位为战场像素（图鉴格数 × 8）。</p>
      </div>

      <div className="config-layout">
        <aside className="config-monster-list">
          <h3>已实现特殊机制</h3>
          {configurableIds.map((id) => {
            const m = MONSTER_MAP[id]
            return (
              <button
                key={id}
                type="button"
                className={selectedId === id ? 'selected' : ''}
                onClick={() => setSelectedId(id)}
              >
                <img src={`/assets/monsters/${id}/idle.png`} alt={m.name} />
                <span>{m.name}</span>
              </button>
            )
          })}
          <p className="config-note">更多怪物技能实现后会自动出现在此列表。</p>
        </aside>

        <div className="config-editor">
          <div className="config-editor-head">
            <div>
              <h3>{def.name}</h3>
              <small>{def.description}</small>
            </div>
            <button type="button" className="config-reset" onClick={() => resetMonsterConfig(selectedId as ConfigurableMonsterId)}>
              恢复默认
            </button>
          </div>

          <div className="config-group">
            <h4>基础属性</h4>
            <div className="config-fields">
              {BASE_STAT_FIELDS.map((field) => (
                <ConfigNumberField
                  key={field.key}
                  field={field}
                  value={baseStats[field.key as keyof BaseMonsterConfig]}
                  onChange={(v) => setBase(field.key as keyof BaseMonsterConfig, v)}
                />
              ))}
            </div>
          </div>

          {skillGroups.map((group) => (
            <div key={group.title} className="config-group">
              <h4>{group.title}</h4>
              <div className="config-fields">
                {group.fields.map((field) => (
                  <ConfigNumberField
                    key={field.key}
                    field={field}
                    value={skillValues[field.key] ?? 0}
                    onChange={(v) => updateSkillValue(selectedId, field.key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
