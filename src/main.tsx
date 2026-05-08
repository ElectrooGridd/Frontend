import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'

// Dismiss the HTML preloader once React is ready
function dismissPreloader() {
  const el = document.getElementById('preloader')
  if (!el) return
  el.classList.add('hide')
  setTimeout(() => el.remove(), 300)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <Helmet defaultTitle="ElectroGrid" />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

dismissPreloader()
