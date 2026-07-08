import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_the_prowler' as const

export const RAW: RawMonsterRow = [
  '徘徊者',
  140,
  '地面，近战电锯攻击，远程三连导弹',
  '160',
  '7至14，远程3',
  '10',
  'cataclysm:the_prowler',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
