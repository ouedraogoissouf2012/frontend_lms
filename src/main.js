import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import './assets/styles/themes.css'
import './assets/styles/mobile-responsive.css'
import { themeKey } from '@/constants/storageKeys'

// Initialiser le thème AVANT de monter l'application.
// Avant le montage, Pinia n'est pas hydraté : on lit le slug d'institution
// directement depuis sessionStorage (même source que le store auth) pour
// résoudre la clé thème SCOPÉE, alignée sur useTheme.js (#24, corrige l'ancienne
// clé non scopée). Pas d'import du store auth (évite tout cycle).
const THEME_KEY = themeKey(sessionStorage.getItem('institution'))
const DEFAULT_THEME = 'light'

// Récupérer le thème sauvegardé
const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return DEFAULT_THEME
}

// Appliquer immédiatement le thème
const initialTheme = getInitialTheme()
if (initialTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
document.documentElement.setAttribute('data-theme', initialTheme)

// Désactiver console.log en production (garder console.error et console.warn)
if (!import.meta.env.DEV) {
  console.log = () => {}
  console.debug = () => {}
  console.info = () => {}
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
