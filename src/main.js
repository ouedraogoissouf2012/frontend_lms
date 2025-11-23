import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import './assets/styles/themes.css'
import './assets/styles/mobile-responsive.css'

// Initialiser le thème AVANT de monter l'application
const THEME_KEY = 'lms-theme-preference'
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

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
