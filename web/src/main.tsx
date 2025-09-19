import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { setApiBase } from './lib/apiClient'

// 👇 API base URL'i .env'den alıyoruz
setApiBase(import.meta.env.VITE_API_BASE);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
