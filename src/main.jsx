import React from 'react'
import ReactDOM from 'react-dom/client'
import RootApp from './App'
import './index.css'
import { registerPWA } from './pwa'

// Register PWA
registerPWA()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
)