import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/vt323'
import '@fontsource/press-start-2p'
import './widgets/index.tsx' // registers native widgets into WIDGET_REGISTRY (D-3.01)
import './index.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
