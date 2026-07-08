import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { MONSTER_MAP } from './data/monsters'
import { loadMonsterConfig, registerMonsterMap } from './game/monsterConfig'

registerMonsterMap(MONSTER_MAP)
loadMonsterConfig()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
