import postcss from 'postcss'
import woff2OnlyFontFace from './postcss-woff2-only.mjs'

/**
 * Plugin Vite (#340) — retire les sources non-woff2 des `@font-face` des CSS
 * d'icônes vendored, AVANT que `vite:css` ne résolve les `url()`.
 *
 * Pourquoi pas `postcss.config.js` : la passe postcss configurée s'exécute
 * DANS `vite:css`, APRÈS que Vite ait scanné/émis les assets des `url()`. Résultat
 * mesuré : le CSS final était bien woff2-only, mais eot/ttf/svg/woff étaient
 * quand même émis dans `dist/assets`. En `enforce: 'pre'`, ce transform réécrit le
 * texte AVANT `vite:css` → les `url()` morts n'existent plus quand Vite scanne →
 * ils ne sont plus émis (~962 Ko en moins). Le runtime (déjà woff2, #341) et les
 * classes de glyphes sont inchangés.
 */
export function isTargetCss(id) {
  const clean = String(id).split('?')[0]
  if (!clean.endsWith('.css')) return false
  // Chemin normalisé Vite (`/`), mais on tolère `\` par prudence Windows.
  return /node_modules[\\/](font-awesome|material-icons)[\\/]/.test(clean)
}

export default function viteStripDeadFonts() {
  return {
    name: 'strip-dead-icon-fonts',
    enforce: 'pre',
    async transform(code, id) {
      if (!isTargetCss(id)) return null
      const result = await postcss([woff2OnlyFontFace()]).process(code, { from: id.split('?')[0] })
      return { code: result.css, map: null }
    },
  }
}
