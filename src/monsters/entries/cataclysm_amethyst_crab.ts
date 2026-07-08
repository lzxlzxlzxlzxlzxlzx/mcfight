import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_amethyst_crab' as const

export const RAW: RawMonsterRow = [
  '紫水晶巨蟹',
  180,
  '地面，缩地时坚硬甲壳免疫伤害，破土而出范围攻击',
  '200',
  '15至16',
  '10',
  'cataclysm:amethyst_crab',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
