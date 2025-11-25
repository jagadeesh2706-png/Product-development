import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css' // optional, create if you like

const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
