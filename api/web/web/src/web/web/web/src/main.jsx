import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'   // This file is optional but recommended

const container = document.getElementById('root')
const root = createRoot(container)

root.render(<App />)
