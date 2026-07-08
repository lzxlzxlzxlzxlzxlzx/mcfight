import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'twilightforest_alpha_yeti' as const

export const RAW: RawMonsterRow = [
  '雪怪首领',
  150,
  '地面，冰雪炸弹，范围控制',
  '200',
  '7',
  '0',
  'twilightforest:alpha_yeti',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
