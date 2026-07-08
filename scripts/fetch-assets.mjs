#!/usr/bin/env node
/**
 * 抓取怪物立体渲染图（Wiki 渲染 / 实体图，非 UV 贴图）
 * 优先级：Fandom Wiki 立体图 > Alex's Caves Wiki > Mod 贴图 > Entity-Icons 占位
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
const THUMB_SIZE = 256

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

const WIKI_HOSTS = {
  mcmobs: 'mcmobs.fandom.com',
  alexsmobs: 'alexs-mobs-unofficial.fandom.com',
  iceandfire: 'ice-and-fire-mod.fandom.com',
  mowziesmobs: 'mowziesmobs.fandom.com',
}

/** unitId -> Wiki 页面标题 */
const WIKI_PAGE_ALIASES = {
  skeleton: 'Skeleton',
  wither_skeleton: 'Wither Skeleton',
  stray: 'Stray',
  pillager: 'Pillager',
  vindicator: 'Vindicator',
  evoker: 'Evoker',
  creeper: 'Creeper',
  witch: 'Witch',
  blaze: 'Blaze',
  warden: 'Warden',
  iron_golem: 'Iron Golem',
  ravager: 'Ravager',
  'alexsmobs:centipede_head': 'Cave Centipede',
  'alexsmobs:tarantula_hawk': 'Tarantula Hawk',
  'alexscaves:teleto': 'Teletor',
  'iceandfire:stymphalianbird': 'Stymphalian Bird',
  'twilightforest:alpha_yeti': 'Alpha Yeti',
  'twilightforest:armored_giant': 'Armored Giant',
  'twilightforest:giant_miner': 'Giant Miner',
  'twilightforest:blockchain_goblin': 'Goblin Knight',
  'twilightforest:king_spider': 'King Spider',
  'twilightforest:death_tome': 'Death Tome',
  'twilightforest:skeleton_druid': 'Skeleton Druid',
  'twilightforest:fire_beetle': 'Fire Beetle',
  'twilightforest:slime_beetle': 'Slime Beetle',
  'twilightforest:minoshroom': 'Minoshroom',
  'twilightforest:minotaur': 'Minotaur',
  'twilightforest:winter_wolf': 'Winter Wolf',
  'twilightforest:mist_wolf': 'Mist Wolf',
  'twilightforest:tower_golem': 'Towerwood Golem',
  'mowziesmobs:naga': 'Naga',
  'cataclysm:koboleton': 'Koboleton',
  'cataclysm:ender_golem': 'Ender Golem',
  'cataclysm:the_harbinger': 'The Harbinger',
  'cataclysm:the_prowler': 'The Prowler',
  'cataclysm:the_watcher': 'The Watcher',
  'cataclysm:ancient_remnant': 'Ancient Remnant',
  'cataclysm:kobolediator': 'Kobolediator',
  'cataclysm:amethyst_crab': 'Amethyst Crab',
  'cataclysm:ignited_revenant': 'Ignited Revenant',
  'cataclysm:coralssus': 'Coralssus',
  'cataclysm:wadjet': 'Wadjet',
  'cataclysm:coral_golem': 'Coral Golem',
  'cataclysm:modern_remnant': 'Modern Remnant',
  'cataclysm:deepling_brute': 'Deepling Brute',
  'cataclysm:deepling_priest': 'Deepling Priest',
  'cataclysm:deepling_warlock': 'Deepling Warlock',
  'cataclysm:deepling': 'Deepling',
  'iceandfire:dread_lich': 'Dread Lich',
}

const SKIP_IMAGE = /arrow|bone\.png|bow\.|coal|ingot|download\s*\(|images\s*\(|\.gif$/i

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new Error(`${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 80) throw new Error('too small')
  return buf
}

function isLikelyUvAtlas(buf) {
  if (buf.length < 24 || buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') {
    return false
  }
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  if (w === 64 && h === 32) return true
  if (h <= 32 && w >= 64 && w >= h * 1.5) return true
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

function cap(w) {
  return w.charAt(0).toUpperCase() + w.slice(1)
}

function toPageTitle(entityName) {
  if (entityName.startsWith('the_')) {
    return `The ${entityName.slice(4).split('_').map(cap).join(' ')}`
  }
  if (entityName.startsWith('if_')) {
    return entityName.slice(3).split('_').map(cap).join(' ')
  }
  return entityName.split('_').map(cap).join(' ')
}

function toPascalCase(entityName) {
  return entityName.split('_').map(cap).join('')
}

function wikiPageTitle(unitId) {
  return WIKI_PAGE_ALIASES[unitId] ?? toPageTitle(unitId.includes(':') ? unitId.split(':')[1] : unitId)
}

async function wikiApi(wikiHost, params) {
  const q = new URLSearchParams({ format: 'json', ...params })
  const res = await fetch(`https://${wikiHost}/api.php?${q}`, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

async function fetchFandomFileUrl(wikiHost, fileTitle) {
  const data = await wikiApi(wikiHost, {
    action: 'query',
    titles: fileTitle,
    prop: 'imageinfo',
    iiprop: 'url',
  })
  const page = data.query?.pages?.[Object.keys(data.query.pages)[0]]
  return page?.imageinfo?.[0]?.url ?? null
}

async function fetchFandomRender(wikiHost, pageTitle) {
  const title = pageTitle.replace(/ /g, '_')

  const thumbData = await wikiApi(wikiHost, {
    action: 'query',
    titles: title,
    prop: 'pageimages',
    pithumbsize: String(THUMB_SIZE),
  })
  const thumbPage = thumbData.query?.pages?.[Object.keys(thumbData.query.pages)[0]]
  if (thumbPage?.thumbnail?.source) {
    const url = thumbPage.thumbnail.source.replace(/scale-to-width-down\/\d+/, `scale-to-width-down/${THUMB_SIZE}`)
    return fetchBuffer(url)
  }

  const imgData = await wikiApi(wikiHost, {
    action: 'query',
    titles: title,
    prop: 'images',
  })
  const imgPage = imgData.query?.pages?.[Object.keys(imgData.query.pages)[0]]
  if (!imgPage?.images?.length) return null

  const candidates = imgPage.images
    .map((i) => i.title)
    .filter((t) => !SKIP_IMAGE.test(t))
    .filter((t) => /\.(png|webp|jpg|jpeg)$/i.test(t) || /render|entity|mob|screenshot/i.test(t))

  for (const fileTitle of candidates.slice(0, 5)) {
    try {
      const url = await fetchFandomFileUrl(wikiHost, fileTitle)
      if (url) return fetchBuffer(url)
    } catch {
      // next file
    }
  }
  return null
}

async function fetchAlexCavesRender(entityName) {
  const pascal = toPascalCase(entityName)
  const tries = [
    `File:${pascal}.png`,
    `File:${pascal}Face.png`,
  ]
  for (const file of tries) {
    try {
      const data = await wikiApi('alexscaves.wiki.gg', {
        action: 'query',
        titles: file,
        prop: 'imageinfo',
        iiprop: 'url',
      })
      const page = data.query?.pages?.[Object.keys(data.query.pages)[0]]
      const url = page?.imageinfo?.[0]?.url
      if (url) {
        const buf = await fetchBuffer(url)
        if (!isLikelyUvAtlas(buf)) return buf
      }
    } catch {
      // continue
    }
  }
  return null
}

async function fetchWikiImage(unitId) {
  const [ns] = unitId.includes(':') ? unitId.split(':') : ['minecraft', unitId]
  const pageTitle = wikiPageTitle(unitId)
  const hosts = [WIKI_HOSTS.mcmobs]

  if (ns === 'alexsmobs') hosts.push(WIKI_HOSTS.alexsmobs)
  if (ns === 'iceandfire') hosts.push(WIKI_HOSTS.iceandfire)
  if (ns === 'mowziesmobs') hosts.push(WIKI_HOSTS.mowziesmobs)

  for (const host of hosts) {
    try {
      const buf = await fetchFandomRender(host, pageTitle)
      if (buf && !isLikelyUvAtlas(buf)) return buf
    } catch {
      // next host
    }
    await sleep(120)
  }

  if (ns === 'alexscaves') {
    try {
      const buf = await fetchAlexCavesRender(unitId.split(':')[1])
      if (buf) return buf
    } catch {
      // fall through
    }
  }

  return null
}

function saveSprite(buf, dir) {
  fs.writeFileSync(path.join(dir, 'idle.png'), buf)
  fs.copyFileSync(path.join(dir, 'idle.png'), path.join(dir, 'attack.png'))
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

function modUrls(unitId) {
  if (!unitId.includes(':')) return []
  const [ns, name] = unitId.split(':')
  const base = MOD_REPOS[ns]
  if (!base) return []
  return [`${base}/${name}.png`, `${base}/${name}/${name}.png`]
}

function buildEntityIconMap(json) {
  const map = new Map()
  for (let r = 1; r <= json.entities.rows; r++) {
    const row = json.entities[`row_${r}`]
    if (!row) continue
    row.forEach((entry, col) => {
      const key = entry.entity.startsWith('minecraft:') ? entry.entity : `minecraft:${entry.entity}`
      map.set(key, { col, row: r - 1 })
    })
  }
  return map
}

function cropIconFromSheet(sheetPath, col, row, outPath) {
  const icon = 16
  const x = col * icon
  const y = row * icon
  const sheet = sheetPath.replace(/\\/g, '/')
  const out = outPath.replace(/\\/g, '/')
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('${sheet}')
$dest = New-Object System.Drawing.Bitmap 64,64
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.Clear([System.Drawing.Color]::FromArgb(0,0,0,0))
$srcRect = New-Object System.Drawing.Rectangle ${x},${y},${icon},${icon}
$destRect = New-Object System.Drawing.Rectangle 0,0,64,64
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
  if (!fs.existsSync(sheetPath)) fs.writeFileSync(sheetPath, await fetchBuffer(ICONS_SHEET))
  if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, await fetchBuffer(ICONS_JSON))
  return { sheetPath, map: buildEntityIconMap(JSON.parse(fs.readFileSync(jsonPath, 'utf8'))) }
}

async function fetchVanillaIconFallback(entityId, dir, sheetPath, iconMap) {
  const pos = iconMap.get(entityId)
  if (!pos) return false
  cropIconFromSheet(sheetPath, pos.col, pos.row, path.join(dir, 'idle.png'))
  fs.copyFileSync(path.join(dir, 'idle.png'), path.join(dir, 'attack.png'))
  return true
}

async function makePlaceholderPng(name, variant = 'idle') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  if (variant === 'attack') h = (h + 40) % 360
  const hex = h.toString(16).padStart(6, '0').slice(0, 6)
  return fetchBuffer(`https://placehold.co/64x64/${hex}/ffffff/png?text=${encodeURIComponent(name.slice(0, 2))}`)
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  fs.mkdirSync(EFFECTS, { recursive: true })

  const { sheetPath, map: iconMap } = await loadEntityIcons()
  const monsters = parseMonstersFromSource()
  let wikiOk = 0
  let iconFallback = 0
  let modOk = 0
  let placeholder = 0
  const stillMissing = []

  for (const m of monsters) {
    const dir = path.join(OUT, m.id)
    fs.mkdirSync(dir, { recursive: true })

    const wikiBuf = await fetchWikiImage(m.unitId)
    if (wikiBuf) {
      saveSprite(wikiBuf, dir)
      console.log(`[Wiki立体] ${m.name}`)
      wikiOk++
      await sleep(150)
      continue
    }

    let buf = await tryDownload(modUrls(m.unitId))
    if (buf) {
      saveSprite(buf, dir)
      console.log(`[Mod贴图] ${m.name}`)
      modOk++
      continue
    }

    const vanillaEntity = VANILLA_ENTITIES[m.unitId]
    if (vanillaEntity && await fetchVanillaIconFallback(vanillaEntity, dir, sheetPath, iconMap)) {
      console.log(`[图标兜底] ${m.name}`)
      iconFallback++
      continue
    }

    try {
      fs.writeFileSync(path.join(dir, 'idle.png'), await makePlaceholderPng(m.name, 'idle'))
      fs.writeFileSync(path.join(dir, 'attack.png'), await makePlaceholderPng(m.name, 'attack'))
      console.log(`[占位] ${m.name}`)
      stillMissing.push(`${m.name} (${m.id})`)
      placeholder++
    } catch (e) {
      console.log(`[失败] ${m.name}: ${e.message}`)
      stillMissing.push(`${m.name} (${m.id})`)
      placeholder++
    }
  }

  try {
    const arrow = await fetchBuffer(
      'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.10/assets/minecraft/textures/item/arrow.png',
    )
    fs.writeFileSync(path.join(EFFECTS, 'projectile.png'), arrow)
  } catch {
    console.log('\n箭矢素材跳过（网络限制，可手动保留现有文件）')
  }

  console.log(`\n完成: Wiki立体 ${wikiOk}, Mod ${modOk}, 图标兜底 ${iconFallback}, 占位 ${placeholder}, 共 ${monsters.length}`)
  if (stillMissing.length) {
    console.log(`\n仍需手动补充 (${stillMissing.length}):`)
    stillMissing.forEach((line) => console.log(`  - ${line}`))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
