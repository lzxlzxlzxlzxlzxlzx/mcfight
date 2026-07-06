#!/usr/bin/env node
/**
 * 抓取怪物显示用精灵图（不是 MC 3D UV 贴图图集）
 * - 原版怪：Entity-Icons 16x16 渲染图标，放大到 64x64
 * - Mod 怪：尝试下载，若判定为 UV 贴图则丢弃，改用占位图
 * - 本地 mod jar：同样过滤 UV 贴图
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'assets', 'monsters')
const EFFECTS = path.join(ROOT, 'public', 'assets', 'effects')
const CACHE = path.join(ROOT, 'scripts', '.cache')

const ICONS_SHEET = 'https://raw.githubusercontent.com/Simplexity-Development/Entity-Icons/main/assets/sprite_sheets/16x16_sheet.png'
const ICONS_JSON = 'https://raw.githubusercontent.com/Simplexity-Development/Entity-Icons/main/assets/sprite_sheets/16x16_sprites.json'

const MOD_REPOS = {
  alexscaves: 'https://raw.githubusercontent.com/AlexModGuy/AlexsCaves/main/src/main/resources/assets/alexscaves/textures/entity',
  cataclysm: 'https://raw.githubusercontent.com/lender544/new1.20.1/bd640629/src/main/resources/assets/cataclysm/textures/entity',
  alexsmobs: 'https://raw.githubusercontent.com/AlexModGuy/AlexsMobs/1.20/main/src/main/resources/assets/alexsmobs/textures/entity',
  twilightforest: 'https://raw.githubusercontent.com/TwilightForestTeam/TwilightForest/1.20.x/src/main/resources/assets/twilightforest/textures/entity',
  iceandfire: 'https://raw.githubusercontent.com/AlexModGuy/Ice_and_Fire/1.20.1/src/main/resources/assets/iceandfire/textures/entity',
  mowziesmobs: 'https://raw.githubusercontent.com/bobmowzie/MowziesMobs/1.20.1/src/main/resources/assets/mowziesmobs/textures/entity',
}

// 原版 unitId -> minecraft 实体 id（Entity-Icons）
const VANILLA_ENTITIES = {
  warden: 'minecraft:warden',
  iron_golem: 'minecraft:iron_golem',
  ravager: 'minecraft:ravager',
  evoker: 'minecraft:evoker',
  creeper: 'minecraft:creeper',
  witch: 'minecraft:witch',
  vindicator: 'minecraft:vindicator',
  blaze: 'minecraft:blaze',
  wither_skeleton: 'minecraft:wither_skeleton',
  stray: 'minecraft:stray',
  skeleton: 'minecraft:skeleton',
  pillager: 'minecraft:pillager',
}

// 攻击态优先使用的 special 变体
const ATTACK_VARIANTS = {
  'minecraft:creeper': { special: 'charged_creeper' },
}

async function fetchBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 50) throw new Error('too small')
  return buf
}

function pngSize(buf) {
  if (buf.length < 24 || buf[0] !== 0x89) return null
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

/** MC 实体 UV 贴图（仅针对 PNG）；Wiki 的 webp/jpeg 渲染图直接通过 */
function isLikelyUvAtlas(buf) {
  if (buf.length < 24 || buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') {
    return false
  }
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)

  if (w === 64 && h === 32) return true
  if (h <= 32 && w >= 64 && w >= h * 1.5) return true
  if (w >= 256 || h >= 256) return true
  if (w !== h && w > 100 && h > 40 && w / h >= 1.8) return true
  return false
}

function parseMonstersFromSource() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'monsters.ts'), 'utf8')
  const rows = [...src.matchAll(/'([^']+)',\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']+)'/g)]
  return rows.map((m) => ({
    name: m[1],
    unitId: m[7],
    id: m[7].replace(':', '_'),
  }))
}

function buildEntityIconMap(json) {
  const map = new Map()
  for (let r = 1; r <= json.entities.rows; r++) {
    const row = json.entities[`row_${r}`]
    if (!row) continue
    row.forEach((entry, col) => {
      const key = entry.entity.startsWith('minecraft:') ? entry.entity : `minecraft:${entry.entity}`
      const variantKey = `${key}|${entry.variant ?? ''}|${entry.special ?? ''}`
      map.set(variantKey, { col, row: r - 1 })
      if (!entry.variant && !entry.special) map.set(key, { col, row: r - 1 })
    })
  }
  return map
}

function findIconPos(map, entityId, opts = {}) {
  if (opts.special) {
    const k = `${entityId}|${opts.variant ?? ''}|${opts.special}`
    if (map.has(k)) return map.get(k)
  }
  return map.get(entityId) ?? null
}

function cropIconFromSheet(sheetPath, col, row, outPath, outSize = 64) {
  const icon = 16
  const x = col * icon
  const y = row * icon
  const sheet = sheetPath.replace(/\\/g, '/')
  const out = outPath.replace(/\\/g, '/')
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('${sheet}')
$dest = New-Object System.Drawing.Bitmap ${outSize},${outSize}
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$g.Clear([System.Drawing.Color]::FromArgb(0,0,0,0))
$srcRect = New-Object System.Drawing.Rectangle ${x},${y},${icon},${icon}
$destRect = New-Object System.Drawing.Rectangle 0,0,${outSize},${outSize}
$g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$dest.Save('${out}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $dest.Dispose(); $src.Dispose()
`
  execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\r?\n/g, '; ')}"`, { stdio: 'pipe' })
}

async function loadEntityIcons() {
  fs.mkdirSync(CACHE, { recursive: true })
  const sheetPath = path.join(CACHE, '16x16_sheet.png')
  const jsonPath = path.join(CACHE, '16x16_sprites.json')
  if (!fs.existsSync(sheetPath)) {
    fs.writeFileSync(sheetPath, await fetchBuffer(ICONS_SHEET))
  }
  if (!fs.existsSync(jsonPath)) {
    fs.writeFileSync(jsonPath, await fetchBuffer(ICONS_JSON))
  }
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  return { sheetPath, map: buildEntityIconMap(json) }
}

async function fetchVanillaIcons(entityId, dir, sheetPath, iconMap) {
  const idlePos = findIconPos(iconMap, entityId)
  if (!idlePos) return false

  const idleOut = path.join(dir, 'idle.png')
  cropIconFromSheet(sheetPath, idlePos.col, idlePos.row, idleOut)

  const attackOpts = ATTACK_VARIANTS[entityId]
  const attackPos = attackOpts ? findIconPos(iconMap, entityId, attackOpts) : idlePos
  const attackOut = path.join(dir, 'attack.png')
  if (attackPos && (attackPos.col !== idlePos.col || attackPos.row !== idlePos.row)) {
    cropIconFromSheet(sheetPath, attackPos.col, attackPos.row, attackOut)
  } else {
    fs.copyFileSync(idleOut, attackOut)
  }
  return true
}

function hueFromString(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

async function makePlaceholderPng(name, variant = 'idle') {
  const hue = (hueFromString(name) + (variant === 'attack' ? 40 : 0)) % 360
  const hex = hue.toString(16).padStart(6, '0').slice(0, 6)
  return fetchBuffer(`https://placehold.co/64x64/${hex}/ffffff/png?text=${encodeURIComponent(name.slice(0, 2))}`)
}

async function tryDownload(urls) {
  for (const url of urls) {
    try {
      const buf = await fetchBuffer(url)
      if (isLikelyUvAtlas(buf)) continue
      return buf
    } catch {
      // next
    }
  }
  return null
}

function findLocalModsDirs() {
  const dirs = []
  const env = process.env.MINECRAFT_MODS || process.env.MC_MODS_DIR
  if (env && fs.existsSync(env)) dirs.push(env)
  const appData = process.env.APPDATA
  if (appData) {
    const def = path.join(appData, '.minecraft', 'mods')
    if (fs.existsSync(def)) dirs.push(def)
  }
  return [...new Set(dirs)]
}

function extractTextureFromMods(unitId) {
  const [ns, name] = unitId.includes(':') ? unitId.split(':') : ['minecraft', unitId]
  const patterns = [
    `assets/${ns}/textures/entity/${name}.png`,
    `assets/${ns}/textures/entity/${name}/${name}.png`,
  ]
  for (const modsDir of findLocalModsDirs()) {
    const jars = fs.readdirSync(modsDir).filter((f) => f.endsWith('.jar'))
    for (const jar of jars) {
      const jarPath = path.join(modsDir, jar).replace(/\\/g, '/')
      for (const pattern of patterns) {
        try {
          const ps = `
$zip = [System.IO.Compression.ZipFile]::OpenRead('${jarPath.replace(/'/g, "''")}')
$entry = $zip.Entries | Where-Object { $_.FullName -eq '${pattern}' -or $_.FullName -like '*/${pattern}' } | Select-Object -First 1
if ($entry) {
  $ms = New-Object System.IO.MemoryStream
  $stream = $entry.Open()
  $stream.CopyTo($ms)
  $stream.Close()
  $zip.Dispose()
  [Convert]::ToBase64String($ms.ToArray())
} else { $zip.Dispose(); '' }
`
          const b64 = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024,
          }).trim()
          if (b64 && b64.length > 100) {
            const buf = Buffer.from(b64, 'base64')
            if (!isLikelyUvAtlas(buf)) {
              console.log(`  [本地mod] ${unitId}`)
              return buf
            }
          }
        } catch {
          // continue
        }
      }
    }
  }
  return null
}

function modUrls(unitId) {
  if (!unitId.includes(':')) return []
  const [ns, name] = unitId.split(':')
  const base = MOD_REPOS[ns]
  if (!base) return []
  return [`${base}/${name}.png`, `${base}/${name}/${name}.png`]
}

function toPageTitle(entityName) {
  if (entityName.startsWith('the_')) {
    const rest = entityName.slice(4).split('_').map(cap).join(' ')
    return `The ${rest}`
  }
  if (entityName.startsWith('if_')) {
    return entityName.slice(3).split('_').map(cap).join(' ')
  }
  return entityName.split('_').map(cap).join(' ')
}

function cap(w) {
  return w.charAt(0).toUpperCase() + w.slice(1)
}

function toPascalCase(entityName) {
  return entityName.split('_').map(cap).join('')
}

/** 各 Wiki 页面名与 unitId 不一致时的别名 */
const WIKI_PAGE_ALIASES = {
  'alexsmobs:centipede_head': 'Cave Centipede',
  'alexsmobs:tarantula_hawk': 'Tarantula Hawk',
  'alexscaves:teleto': 'Teletor',
  'iceandfire:stymphalianbird': 'Stymphalian Bird',
  'twilightforest:alpha_yeti': 'Yeti',
  'twilightforest:armored_giant': 'Giant',
  'twilightforest:giant_miner': 'Giant Miner',
  'twilightforest:blockchain_goblin': 'Goblin Knight',
  'twilightforest:king_spider': 'King Spider',
  'twilightforest:death_tome': 'Death Tome',
  'twilightforest:skeleton_druid': 'Skeleton Druid',
  'twilightforest:pinch_beetle': 'Pinch Beetle',
  'twilightforest:fire_beetle': 'Fire Beetle',
  'twilightforest:slime_beetle': 'Slime Beetle',
  'mowziesmobs:naga': 'Flying Naga',
  'cataclysm:koboleton': 'Koboleton',
  'cataclysm:ender_golem': 'Ender Golem',
}

async function fetchFandomThumb(wikiHost, pageTitle) {
  const api = `https://${wikiHost}/api.php?action=query&titles=${encodeURIComponent(pageTitle.replace(/ /g, '_'))}&prop=pageimages&format=json&pithumbsize=128`
  const res = await fetch(api, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(String(res.status))
  const data = await res.json()
  const pages = data.query?.pages ?? {}
  const page = pages[Object.keys(pages)[0]]
  if (!page || page.missing || !page.thumbnail?.source) return null
  const imgUrl = page.thumbnail.source.replace(/scale-to-width-down\/\d+/, 'scale-to-width-down/128')
  return fetchBuffer(imgUrl)
}

async function fetchAlexCavesFace(entityName) {
  const fileName = `${toPascalCase(entityName)}Face.png`
  const api = `https://alexscaves.wiki.gg/api.php?action=query&titles=${encodeURIComponent(`File:${fileName}`)}&prop=imageinfo&iiprop=url&format=json`
  const res = await fetch(api, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(String(res.status))
  const data = await res.json()
  const pages = data.query?.pages ?? {}
  const page = pages[Object.keys(pages)[0]]
  const url = page?.imageinfo?.[0]?.url
  if (!url) return null
  return fetchBuffer(url)
}

async function fetchWikiImage(unitId) {
  const [ns, name] = unitId.includes(':') ? unitId.split(':') : ['minecraft', unitId]
  const pageTitle = WIKI_PAGE_ALIASES[unitId] ?? toPageTitle(name)
  const tries = []

  if (ns === 'alexscaves') tries.push(() => fetchAlexCavesFace(name))
  if (ns === 'alexsmobs') tries.push(() => fetchFandomThumb('alexs-mobs-unofficial.fandom.com', pageTitle))
  if (ns === 'iceandfire') tries.push(() => fetchFandomThumb('ice-and-fire-mod.fandom.com', pageTitle))
  if (ns === 'mowziesmobs') tries.push(() => fetchFandomThumb('mowziesmobs.fandom.com', pageTitle))
  tries.push(() => fetchFandomThumb('mcmobs.fandom.com', pageTitle))

  for (const fn of tries) {
    try {
      const buf = await fn()
      if (buf && !isLikelyUvAtlas(buf)) return buf
    } catch {
      // next source
    }
  }
  return null
}

function saveSprite(buf, dir) {
  fs.writeFileSync(path.join(dir, 'idle.png'), buf)
  fs.copyFileSync(path.join(dir, 'idle.png'), path.join(dir, 'attack.png'))
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  fs.mkdirSync(EFFECTS, { recursive: true })

  const { sheetPath, map: iconMap } = await loadEntityIcons()
  const monsters = parseMonstersFromSource()
  let icons = 0
  let wikiOk = 0
  let modOk = 0
  let placeholder = 0
  const stillMissing = []

  for (const m of monsters) {
    const dir = path.join(OUT, m.id)
    fs.mkdirSync(dir, { recursive: true })

    const vanillaEntity = VANILLA_ENTITIES[m.unitId]
    if (vanillaEntity) {
      const ok = await fetchVanillaIcons(vanillaEntity, dir, sheetPath, iconMap)
      if (ok) {
        console.log(`[原版图标] ${m.name}`)
        icons++
        continue
      }
    }

    const wikiBuf = await fetchWikiImage(m.unitId)
    if (wikiBuf) {
      saveSprite(wikiBuf, dir)
      console.log(`[Wiki] ${m.name}`)
      wikiOk++
      continue
    }

    let buf = await tryDownload(modUrls(m.unitId))
    if (!buf) buf = extractTextureFromMods(m.unitId)

    if (buf) {
      saveSprite(buf, dir)
      console.log(`[Mod贴图] ${m.name}`)
      modOk++
      continue
    }

    try {
      const idle = await makePlaceholderPng(m.name, 'idle')
      const attack = await makePlaceholderPng(m.name, 'attack')
      fs.writeFileSync(path.join(dir, 'idle.png'), idle)
      fs.writeFileSync(path.join(dir, 'attack.png'), attack)
      console.log(`[占位] ${m.name} (${m.unitId})`)
      stillMissing.push(`${m.name} (${m.id})`)
      placeholder++
    } catch (e) {
      console.log(`[失败] ${m.name}: ${e.message}`)
      stillMissing.push(`${m.name} (${m.id})`)
      placeholder++
    }
  }

  const arrow = await fetchBuffer(
    'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.10/assets/minecraft/textures/item/arrow.png',
  )
  fs.writeFileSync(path.join(EFFECTS, 'projectile.png'), arrow)

  console.log(`\n完成: 原版图标 ${icons}, Wiki ${wikiOk}, Mod贴图 ${modOk}, 占位 ${placeholder}, 共 ${monsters.length}`)
  if (stillMissing.length) {
    console.log(`\n仍需手动补充 (${stillMissing.length}):`)
    stillMissing.forEach((line) => console.log(`  - ${line}`))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
