import { createDefFromRaw, type RawMonsterRow } from '../infer'

export const ID = 'cataclysm_wadjet' as const

export const RAW: RawMonsterRow = [
  '瓦吉特',
  150,
  '地面，大范围攻击，召唤沙漠石碑，召唤沙龙卷，强力对空',
  '150',
  '11，石碑18',
  '5',
  'cataclysm:wadjet',
]

export function createDef() {
  return createDefFromRaw(RAW)
}
