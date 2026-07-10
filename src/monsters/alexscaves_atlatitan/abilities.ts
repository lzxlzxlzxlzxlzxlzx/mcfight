import { getAtlantitanConfig } from './config'

export const ATLATITAN_ID = 'alexscaves_atlatitan'

export function getAtlantitanAoeRadius() {
  return getAtlantitanConfig().aoeRadius
}

export function getAtlantitanAoeDamage() {
  return getAtlantitanConfig().attack
}
