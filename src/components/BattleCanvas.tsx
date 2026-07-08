import { useEffect, useRef } from 'react'
import type { ActiveBeam, BattleSnapshot, ConeStrikeEffect, FallingObelisk, LavaPatch, LinearSandTornado, MeteorEffect, SandTornado, ShockwaveEffect, StatusEffectType } from '../game/types'
import { BATTLE_FIELD } from '../game/battleEngine'
import { getUnitDisplaySize } from '../game/field'
import { getTremorBeam } from '../game/abilities/tremorzilla'
import { getStompWaveBandGeom, getTornadoPosition } from '../game/abilities/ancientRemnant'
import { getMonsterSpriteUrl, MONSTER_MAP } from '../data/monsters'

interface Props {
  snapshot: BattleSnapshot
}

const TEAM_RANGE = {
  0: { ring: '#4a9eff', shock: '#5dade2', fill: 'rgba(74,158,255,0.14)' },
  1: { ring: '#ff6b4a', shock: '#ec7063', fill: 'rgba(255,107,74,0.14)' },
} as const

const TEAM_BEAM = {
  0: {
    core: 'rgba(120, 210, 255, 0.95)',
    glow: 'rgba(74, 158, 255, 0.75)',
    fill: 'rgba(74,158,255,0.22)',
    deathCore: 'rgba(180, 220, 255, 0.95)',
    deathGlow: 'rgba(74, 158, 255, 0.88)',
    deathFill: 'rgba(74,158,255,0.28)',
  },
  1: {
    core: 'rgba(255, 220, 200, 0.95)',
    glow: 'rgba(255, 107, 74, 0.85)',
    fill: 'rgba(255,107,74,0.22)',
    deathCore: 'rgba(255, 220, 220, 0.95)',
    deathGlow: 'rgba(255, 60, 60, 0.88)',
    deathFill: 'rgba(255,40,40,0.28)',
  },
} as const

const TEAM_PROJECTILE = {
  0: {
    default: '#ffd966',
    laser: '#5dade2',
    wither: '#9b8cff',
    homing: '#7ec8ff',
  },
  1: {
    default: '#ffaa44',
    laser: '#ff6b6b',
    wither: '#d988ff',
    homing: '#ff9f7a',
  },
} as const

function projectileColor(p: BattleSnapshot['projectiles'][number]) {
  const palette = TEAM_PROJECTILE[p.team]
  switch (p.kind) {
    case 'harb_laser':
      return palette.laser
    case 'harb_wither':
      return palette.wither
    case 'harb_homing':
      return palette.homing
    default:
      return palette.default
  }
}

const imageCache = new Map<string, HTMLImageElement>()

function loadImage(url: string) {
  if (imageCache.has(url)) return imageCache.get(url)!
  const img = new Image()
  img.src = url
  imageCache.set(url, img)
  return img
}

function shockwaveColors(sw: ShockwaveEffect) {
  return TEAM_RANGE[sw.team]
}

function drawShockwave(ctx: CanvasRenderingContext2D, sw: ShockwaveEffect, scale: number) {
  const t = 1 - sw.remaining / sw.duration
  const radius = sw.maxRadius * Math.min(1, t * 1.15)
  const alpha = Math.min(1, sw.remaining / sw.duration + 0.15)
  const cx = sw.x * scale
  const cy = sw.y * scale
  const colors = shockwaveColors(sw)
  const r = radius * scale

  ctx.save()
  ctx.globalAlpha = alpha

  ctx.fillStyle = colors.fill
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = colors.ring
  ctx.lineWidth = 3 * scale
  ctx.setLineDash([10 * scale, 6 * scale])
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = colors.shock
  ctx.lineWidth = 5 * scale
  ctx.globalAlpha = alpha * 0.7
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2)
  ctx.stroke()

  const overlay = sw.kind === 'meteor'
    ? loadImage('/assets/effects/meteor_explosion.svg')
    : sw.kind === 'fire'
      ? loadImage('/assets/effects/shockwave.svg')
      : sw.kind === 'sand'
        ? loadImage('/assets/effects/obelisk_strike.svg')
        : loadImage('/assets/effects/shockwave.svg')
  if (overlay.complete && overlay.naturalWidth > 0) {
    ctx.globalAlpha = alpha * (sw.kind === 'meteor' ? 0.75 : sw.kind === 'sand' ? 0.35 : 0.45)
    const size = radius * 2 * scale
    ctx.drawImage(overlay, cx - size / 2, cy - size / 2, size, size)
  }

  ctx.restore()
}

function drawLava(ctx: CanvasRenderingContext2D, lava: LavaPatch, scale: number, tick: number) {
  const cx = lava.x * scale
  const cy = lava.y * scale
  const size = lava.radius * 2 * scale
  const pulse = 0.75 + 0.25 * Math.sin(tick * 0.15 + lava.x * 0.02)
  const fade = Math.min(1, lava.remaining / 4)

  ctx.save()
  ctx.globalAlpha = fade * 0.88 * pulse
  const img = loadImage('/assets/effects/lava.svg')
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
  } else {
    ctx.fillStyle = 'rgba(204,51,0,0.75)'
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawMeteor(ctx: CanvasRenderingContext2D, m: MeteorEffect, scale: number) {
  const t = Math.min(1, m.fallProgress)
  const cx = m.x * scale
  const groundY = m.y * scale
  const skyY = -30 * scale
  const cy = skyY + (groundY - skyY) * t
  const s = (12 + t * 14) * scale
  const trail = 20 * t * scale

  ctx.save()
  const img = loadImage('/assets/effects/meteor.svg')
  if (img.complete && img.naturalWidth > 0) {
    ctx.globalAlpha = 0.5 + t * 0.5
    ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s)
  } else {
    ctx.fillStyle = '#ff6b35'
    ctx.beginPath()
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(255,180,60,0.6)'
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(cx, cy - s / 2)
  ctx.lineTo(cx, cy - s / 2 - trail)
  ctx.stroke()
  ctx.restore()
}

/** 约 30° 张角、有宽度的圆弧海浪（与 getStompWaveBandGeom 完全一致） */
function drawArcWaveBand(
  ctx: CanvasRenderingContext2D,
  geom: ReturnType<typeof getStompWaveBandGeom>,
  scale: number,
  alpha: number,
  team: 0 | 1,
  tick: number,
) {
  const outer = geom.outerReach * scale
  const inner = geom.innerReach * scale
  if (outer <= 1) return

  const { start, end } = geom
  const colors = TEAM_RANGE[team]
  const cx = geom.cx * scale
  const cy = geom.cy * scale
  const crest = 0.88 + 0.12 * Math.sin(tick * 0.55)

  const drawBand = (outR: number, inR: number, a: number) => {
    if (outR <= inR + 0.5) {
      ctx.globalAlpha = alpha * a
      ctx.fillStyle = colors.fill
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, outR, start, end)
      ctx.closePath()
      ctx.fill()

      ctx.globalAlpha = alpha * a * crest
      ctx.strokeStyle = colors.shock
      ctx.lineWidth = 4.5 * scale
      ctx.beginPath()
      ctx.arc(0, 0, outR, start, end)
      ctx.stroke()
      return
    }

    ctx.globalAlpha = alpha * a
    ctx.fillStyle = colors.fill
    ctx.beginPath()
    ctx.arc(0, 0, outR, start, end)
    ctx.arc(0, 0, inR, end, start, true)
    ctx.closePath()
    ctx.fill()

    ctx.globalAlpha = alpha * a * crest
    ctx.strokeStyle = colors.shock
    ctx.lineWidth = 4.5 * scale
    ctx.beginPath()
    ctx.arc(0, 0, outR, start, end)
    ctx.stroke()

    ctx.globalAlpha = alpha * a * 0.45
    ctx.strokeStyle = colors.ring
    ctx.lineWidth = 2 * scale
    ctx.setLineDash([5 * scale, 4 * scale])
    ctx.beginPath()
    ctx.arc(0, 0, inR, end, start, true)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.globalAlpha = alpha * a * 0.7
    ctx.strokeStyle = '#fff8dc'
    ctx.lineWidth = 1.5 * scale
    ctx.beginPath()
    ctx.moveTo(Math.cos(start) * inR, Math.sin(start) * inR)
    ctx.lineTo(Math.cos(start) * outR, Math.sin(start) * outR)
    ctx.moveTo(Math.cos(end) * inR, Math.sin(end) * inR)
    ctx.lineTo(Math.cos(end) * outR, Math.sin(end) * outR)
    ctx.stroke()
  }

  ctx.save()
  ctx.translate(cx, cy)
  drawBand(outer, Math.max(0, inner), 1)
  ctx.restore()
}

function drawConeStrike(ctx: CanvasRenderingContext2D, cone: ConeStrikeEffect, scale: number, tick: number) {
  drawArcWaveBand(ctx, getStompWaveBandGeom(cone), scale, 0.92, cone.team, tick)
}

function drawSandTornado(
  ctx: CanvasRenderingContext2D,
  tornado: SandTornado,
  units: BattleSnapshot['units'],
  scale: number,
  tick: number,
) {
  const pos = getTornadoPosition(tornado, units)
  const cx = pos.x * scale
  const cy = pos.y * scale
  const s = tornado.hitRadius * 2 * scale
  const spin = tick * 0.2 + tornado.orbitIndex

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(spin)
  const img = loadImage('/assets/effects/sand_tornado.svg')
  if (img.complete && img.naturalWidth > 0) {
    ctx.globalAlpha = 0.82
    ctx.drawImage(img, -s / 2, -s / 2, s, s)
  } else {
    ctx.fillStyle = 'rgba(244,208,63,0.65)'
    ctx.beginPath()
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawLinearSandTornado(
  ctx: CanvasRenderingContext2D,
  tornado: LinearSandTornado,
  scale: number,
  tick: number,
) {
  const cx = tornado.x * scale
  const cy = tornado.y * scale
  const s = tornado.hitRadius * 2.2 * scale
  const spin = tick * 0.25 + tornado.x * 0.01

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(spin)
  const img = loadImage('/assets/effects/sand_tornado.svg')
  if (img.complete && img.naturalWidth > 0) {
    ctx.globalAlpha = 0.88
    ctx.drawImage(img, -s / 2, -s / 2, s, s)
  } else {
    ctx.fillStyle = 'rgba(244,208,63,0.7)'
    ctx.beginPath()
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawFallingObelisk(ctx: CanvasRenderingContext2D, stone: FallingObelisk, scale: number) {
  const cx = stone.x * scale
  const groundY = stone.y * scale
  const skyY = groundY - 90 * scale
  const t = stone.landed ? 1 : Math.min(1, stone.fallProgress)
  const cy = skyY + (groundY - skyY) * (t * t)
  const s = (stone.landed ? 18 : 10 + t * 10) * scale

  ctx.save()
  const img = loadImage('/assets/effects/obelisk_strike.svg')
  if (img.complete && img.naturalWidth > 0) {
    ctx.globalAlpha = stone.landed ? 1 : 0.55 + t * 0.45
    ctx.drawImage(img, cx - s / 2, cy - s, s, s * 1.15)
  } else {
    ctx.fillStyle = '#7f8c8d'
    ctx.fillRect(cx - s / 2, cy - s, s, s)
  }

  if (!stone.landed && t > 0.15) {
    ctx.strokeStyle = 'rgba(180,160,120,0.35)'
    ctx.lineWidth = 2 * scale
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx, groundY)
    ctx.stroke()
  }

  if (stone.landed) {
    ctx.globalAlpha = Math.min(1, stone.linger / 0.35) * 0.35
    ctx.fillStyle = TEAM_RANGE[stone.team].fill
    ctx.beginPath()
    ctx.arc(cx, groundY, stone.impactRadius * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawBeam(ctx: CanvasRenderingContext2D, beam: ActiveBeam, scale: number, tick: number) {
  const isDeathLaser = beam.kind === 'harbinger_death'
  const angle = Math.atan2(beam.dirY, beam.dirX) - Math.PI / 2
  const pulse = 0.65 + 0.35 * Math.sin(tick * 0.4)
  const w = beam.halfWidth * 2 * scale
  const h = beam.length * scale
  const teamBeam = TEAM_BEAM[beam.team]
  const colors = isDeathLaser
    ? { ring: TEAM_RANGE[beam.team].ring, shock: teamBeam.deathGlow, fill: teamBeam.deathFill }
    : TEAM_RANGE[beam.team]

  ctx.save()
  ctx.translate(beam.originX * scale, beam.originY * scale)
  ctx.rotate(angle)
  ctx.globalAlpha = pulse * 0.35
  ctx.fillStyle = colors.fill
  ctx.fillRect(-w, 0, w * 2, h)
  ctx.globalAlpha = pulse

  if (isDeathLaser) {
    ctx.fillStyle = teamBeam.deathGlow
    ctx.fillRect(-w / 2, 0, w, h)
    ctx.fillStyle = teamBeam.deathCore
    ctx.fillRect(-w / 6, 0, w / 3, h)
  } else {
    ctx.fillStyle = teamBeam.glow
    ctx.fillRect(-w / 2, 0, w, h)
    ctx.fillStyle = teamBeam.core
    ctx.fillRect(-w / 6, 0, w / 3, h)
  }
  ctx.restore()
}

function drawBeamCastRange(
  ctx: CanvasRenderingContext2D,
  unit: BattleSnapshot['units'][number],
  beam: ActiveBeam,
  scale: number,
) {
  const colors = TEAM_RANGE[unit.team]
  const ox = unit.x * scale
  const oy = unit.y * scale
  const castR = getTremorBeam().castRange * scale

  ctx.save()
  ctx.strokeStyle = colors.ring
  ctx.lineWidth = 2 * scale
  ctx.setLineDash([5 * scale, 5 * scale])
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.arc(ox, oy, castR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = colors.shock
  ctx.lineWidth = 2 * scale
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(beam.originX * scale + beam.dirX * castR, beam.originY * scale + beam.dirY * castR)
  ctx.stroke()
  ctx.restore()
}

function drawUnit(
  ctx: CanvasRenderingContext2D,
  unit: BattleSnapshot['units'][number],
  scale: number,
  channelingBeam: ActiveBeam | undefined,
) {
  const def = MONSTER_MAP[unit.monsterId]
  const action = unit.attackAnimTimer > 0 || channelingBeam || unit.leapTimeLeft > 0 || unit.remnantCastTimeLeft > 0 || unit.harbChargeTimeLeft > 0
    ? 'attack'
    : 'idle'
  const img = loadImage(getMonsterSpriteUrl(unit.monsterId, action))
  const size = getUnitDisplaySize(def.tags) * scale

  if (channelingBeam && channelingBeam.kind !== 'harbinger_death') {
    drawBeamCastRange(ctx, unit, channelingBeam, scale)
  }

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

  const effectColors: Record<StatusEffectType, string> = {
    poison: '#2ecc71',
    burn: '#e74c3c',
    wither: '#2c2c2c',
    slow: '#85c1e9',
  }
  unit.statusEffects.forEach((effect, i) => {
    ctx.fillStyle = effectColors[effect.type]
    ctx.beginPath()
    ctx.arc(
      unit.x * scale - 8 * scale + i * 7 * scale,
      unit.y * scale - size / 2 - 16 * scale,
      3 * scale,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  })
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

    for (const lava of snapshot.lavaPatches) {
      drawLava(ctx, lava, scale, snapshot.tick)
    }

    for (const sw of snapshot.shockwaves) {
      drawShockwave(ctx, sw, scale)
    }

    for (const stone of snapshot.fallingObelisks) {
      drawFallingObelisk(ctx, stone, scale)
    }

    for (const tornado of snapshot.sandTornados) {
      drawSandTornado(ctx, tornado, snapshot.units, scale, snapshot.tick)
    }

    for (const tornado of snapshot.linearSandTornados) {
      drawLinearSandTornado(ctx, tornado, scale, snapshot.tick)
    }

    for (const cone of snapshot.coneStrikes) {
      drawConeStrike(ctx, cone, scale, snapshot.tick)
    }

    for (const m of snapshot.meteors) {
      drawMeteor(ctx, m, scale)
    }

    for (const beam of snapshot.activeBeams) {
      drawBeam(ctx, beam, scale, snapshot.tick)
    }

    for (const p of snapshot.projectiles) {
      const isHarb = p.kind && p.kind !== 'default'
      const s = (isHarb ? 12 : 10) * scale
      const px = p.x * scale
      const py = p.y * scale
      ctx.fillStyle = projectileColor(p)
      ctx.beginPath()
      ctx.arc(px, py, s / 2, 0, Math.PI * 2)
      ctx.fill()
      if (p.kind === 'harb_homing' && p.dirX != null && p.dirY != null) {
        ctx.strokeStyle = projectileColor(p)
        ctx.lineWidth = 2 * scale
        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px - p.dirX * s * 1.2, py - p.dirY * s * 1.2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    const drawOrder = [...snapshot.units].sort((a, b) => a.y - b.y)
    for (const unit of drawOrder) {
      if (unit.state === 'dead') continue
      const channelingBeam = snapshot.activeBeams.find((b) => b.sourceId === unit.id)
      drawUnit(ctx, unit, scale, channelingBeam)
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
