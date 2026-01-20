import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'animate.css'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter basename="/car_inventory1">
      <App />
    </HashRouter>
  </React.StrictMode>
)
