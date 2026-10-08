import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Deck } from './Deck'
import { ROTA } from './config'

if (!location.pathname.startsWith(ROTA)) location.replace(ROTA + location.hash)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Deck />
  </StrictMode>,
)
