import { useEffect, useRef } from 'react'
import type { BattleSnapshot } from '../game/types'
import { BATTLE_FIELD } from '../game/battleEngine'
import { getMonsterSpriteUrl, MONSTER_MAP } from '../data/monsters'

interface Props {
  snapshot: BattleSnapshot
}

const imageCache = new Map<string, HTMLImageElement>()

function loadImage(url: string) {
  if (imageCache.has(url)) return imageCache.get(url)!
  const img = new Image()
  img.src = url
  imageCache.set(url, img)
  return img
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  unit: BattleSnapshot['units'][number],
  scale: number,
) {
  const def = MONSTER_MAP[unit.monsterId]
  const action = unit.attackAnimTimer > 0 ? 'attack' : 'idle'
  const img = loadImage(getMonsterSpriteUrl(unit.monsterId, action))
  const size = (def.tags.includes('boss') ? 56 : 40) * scale

  ctx.save()
  ctx.translate(unit.x * scale, unit.y * scale)
  if (unit.facing < 0) ctx.scale(-1, 1)

  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -size / 2, -size / 2, size, size)
  } else {
    ctx.fillStyle = unit.team === 0 ? '#4a9eff' : '#ff6b4a'
    ctx.beginPath()
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `${12 * scale}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(def.name.slice(0, 2), 0, 4 * scale)
  }

  ctx.restore()

  const barW = 36 * scale
  const barH = 5 * scale
  const hpPct = Math.max(0, unit.hp / unit.maxHp)
  ctx.fillStyle = '#222'
  ctx.fillRect(unit.x * scale - barW / 2, unit.y * scale - size / 2 - 10 * scale, barW, barH)
  ctx.fillStyle = unit.team === 0 ? '#5dade2' : '#ec7063'
  ctx.fillRect(unit.x * scale - barW / 2, unit.y * scale - size / 2 - 10 * scale, barW * hpPct, barH)
}

export function BattleCanvas({ snapshot }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width / BATTLE_FIELD.width
    const scaleY = rect.height / BATTLE_FIELD.height
    const scale = Math.min(scaleX, scaleY)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#3d5c2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const offsetX = (canvas.width - BATTLE_FIELD.width * scale) / 2
    const offsetY = (canvas.height - BATTLE_FIELD.height * scale) / 2
    ctx.save()
    ctx.translate(offsetX, offsetY)

    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo((BATTLE_FIELD.width / 2) * scale, 0)
    ctx.lineTo((BATTLE_FIELD.width / 2) * scale, BATTLE_FIELD.height * scale)
    ctx.stroke()
    ctx.setLineDash([])

    for (const p of snapshot.projectiles) {
      const img = loadImage('/assets/effects/projectile.png')
      const s = 10 * scale
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, p.x * scale - s / 2, p.y * scale - s / 2, s, s)
      } else {
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.arc(p.x * scale, p.y * scale, s / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawOrder = [...snapshot.units].sort((a, b) => a.y - b.y)
    for (const unit of drawOrder) {
      if (unit.state === 'dead') continue
      drawUnit(ctx, unit, scale)
    }

    ctx.restore()
  }, [snapshot])

  return (
    <canvas
      ref={canvasRef}
      width={BATTLE_FIELD.width}
      height={BATTLE_FIELD.height}
      className="battle-canvas"
    />
  )
}
