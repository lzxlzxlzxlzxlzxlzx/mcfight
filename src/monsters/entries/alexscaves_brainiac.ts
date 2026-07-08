import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'alexscaves_brainiac' as const

export const RAW: RawMonsterRow = [
  '舐脑魔',
  40,
  '地面，近战，远程范围辐射酸液投掷',
  '40',
  '5',
  '8',
  'alexscaves:brainiac',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
