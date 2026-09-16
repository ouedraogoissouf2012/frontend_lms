import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import viteStripDeadFonts from './scripts/vite-strip-dead-fonts.mjs'

export default defineConfig({
  // #340 : viteStripDeadFonts en `enforce: 'pre'` retire les url() non-woff2 des
  // @font-face d'icônes AVANT le scan d'assets de vite:css (sinon eot/ttf/svg/woff
  // sont émis dans dist malgré un CSS final woff2-only).
  plugins: [viteStripDeadFonts(), vue()],
  esbuild: {
    // #234/#241 : retirer TOUS les console.* du bundle prod. console.error/warn
    // recevaient l'objet erreur axios qui porte l'en-tête Authorization (Bearer)
    // → fuite du token/PII en console. Les erreurs à surfacer passent par
    // errorHandler.logError (prod-safe) ou par un toast utilisateur.
    pure: ['console.log', 'console.info', 'console.debug', 'console.error', 'console.warn'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Cible en 127.0.0.1 (IPv4) et NON `localhost` : sur Windows + Node >= 17,
      // `localhost` se résout d'abord en `::1` (IPv6), or `php artisan serve`
      // n'écoute que sur 127.0.0.1 — mesuré : le port 8000 n'est ouvert qu'en
      // IPv4. Aujourd'hui le proxy s'en sort par repli, faute de quoi que ce
      // soit sur `::1:8000` ; viser IPv4 supprime la dépendance à ce repli.
      // Symptôme quand il ne joue pas : le login affiche « Identifiants
      // incorrects » alors que la requête n'a jamais atteint le serveur.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
