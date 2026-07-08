#!/usr/bin/env node
/**
 * 从 monsters.ts RAW 表生成 src/monsters/entries/{id}.ts
 * 已单独实现的 Boss 跳过（由 monsters/{id}/ 目录维护）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const monstersTs = fs.readFileSync(path.join(root, 'src/data/monsters.ts'), 'utf8')

const SKIP = new Set([
  'alexscaves:tremorzilla',
  'alexscaves:luxtructosaurus',
  'cataclysm:ancient_remnant',
])

const rawMatch = monstersTs.match(/const RAW[^=]*=\s*\[([\s\S]*?)\]\s*\n\nexport const MONSTERS/)
if (!rawMatch) {
  console.error('RAW block not found')
  process.exit(1)
}

const rowRe = /\['([^']*(?:\\'[^']*)*)',\s*(\d+),\s*'([^']*(?:\\'[^']*)*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\]/g
const rows = []
let m
while ((m = rowRe.exec(rawMatch[1])) !== null) {
  rows.push({
    name: m[1],
    price: Number(m[2]),
    desc: m[3],
    hp: m[4],
    atk: m[5],
    armor: m[6],
    unitId: m[7],
  })
}

const entriesDir = path.join(root, 'src/monsters/entries')
fs.mkdirSync(entriesDir, { recursive: true })

const ids = []
for (const row of rows) {
  if (SKIP.has(row.unitId)) continue
  const id = row.unitId.replace(':', '_')
  ids.push(id)
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const content = `import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = '${id}' as const

export const RAW: RawMonsterRow = [
  '${esc(row.name)}',
  ${row.price},
  '${esc(row.desc)}',
  '${esc(row.hp)}',
  '${esc(row.atk)}',
  '${esc(row.armor)}',
  '${row.unitId}',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
`
  fs.writeFileSync(path.join(entriesDir, `${id}.ts`), content)
}

const indexContent = `${ids.map((id) => `import * as ${id} from './${id}'`).join('\n')}

export const GENERIC_ENTRY_MODULES = [
${ids.map((id) => `  ${id},`).join('\n')}
]
`
fs.writeFileSync(path.join(entriesDir, 'index.ts'), indexContent)
console.log(`Generated ${ids.length} entry files`)
