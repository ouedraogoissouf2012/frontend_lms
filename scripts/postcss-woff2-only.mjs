/**
 * PostCSS plugin — ne garder que le woff2 dans les `src` des `@font-face` (#340).
 *
 * Contexte : les CSS d'icônes vendored (`font-awesome.min.css`,
 * `material-icons/iconfont/filled.css`) déclarent leur `@font-face` avec
 * plusieurs formats (`eot`/`ttf`/`svg`/`woff`/`woff2`). Le runtime ne télécharge
 * déjà que le woff2 (override #341), MAIS Vite traite chaque `url()` du `src` et
 * ÉMET tous ces fichiers dans `dist/assets` (~962 Ko de poids mort).
 *
 * En retirant les sources non-woff2 AVANT que Vite ne résolve les `url()`, Vite
 * ne voit plus que le woff2 → n'émet plus que lui. Purement au build : n'altère
 * ni le runtime (déjà woff2) ni les classes de glyphes (`.fa-*`, `.material-icons`).
 *
 * Idempotent et sans effet sur un `@font-face` déjà woff2-only.
 */

/** Un segment de `src` (ex. `url('x.woff') format('woff')`) vise-t-il le woff2 ? */
export function isWoff2Source(segment) {
  // "woff2" n'est contenu que par les segments woff2 ("woff" seul ne matche pas).
  return /woff2/i.test(segment)
}

/**
 * Réécrit une valeur `src` de `@font-face` pour ne garder que les segments woff2.
 * @returns {string|null} la nouvelle valeur, ou null si plus aucun segment (la
 *   déclaration devra être retirée — ex. `src: url(x.eot)` seul pour IE9).
 */
export function keepWoff2InSrc(value) {
  // Les `url()` de police ne contiennent pas de virgule → découpage simple sûr.
  const kept = value
    .split(',')
    .map((s) => s.trim())
    .filter(isWoff2Source)
  return kept.length ? kept.join(', ') : null
}

export default function woff2OnlyFontFace() {
  return {
    postcssPlugin: 'woff2-only-fontface',
    AtRule: {
      'font-face': (atRule) => {
        atRule.walkDecls('src', (decl) => {
          const next = keepWoff2InSrc(decl.value)
          if (next === null) {
            decl.remove() // ex. la ligne `src: url(...eot)` (fallback IE9) seule
          } else if (next !== decl.value) {
            decl.value = next
          }
        })
      },
    },
  }
}

woff2OnlyFontFace.postcss = true
