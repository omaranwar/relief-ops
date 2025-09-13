import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { setApiBase } from './lib/apiClient'

;(async () => {
  try {
    const cfg = await (await fetch('/config.json')).json()
    setApiBase(cfg.apiBaseUrl)
    // Optional: console log to confirm
    console.log('ReliefOps config loaded:', cfg)
  } catch (e) {
    console.error('Failed to load /config.json', e)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})()
