/**
 * Garde-fou sur l'APPARIEMENT des tokens de couleur des badges de rôle.
 *
 * Défaut constaté en thème sombre sur DashboardRecentUsers :
 *   .role-admin       { background: var(--red-200);   color: var(--error-text); }
 *   .role-coordinator { background: var(--warning-bg); color: var(--amber-800); }
 *
 * `--red-200` et `--amber-800` sont des tokens de PALETTE (valeur unique, définie
 * une fois dans _tokens-palette.css) ; `--error-text` et `--warning-bg` sont des
 * tokens SÉMANTIQUES (redéfinis par thème). Apparier les deux familles fait
 * basculer un seul des deux côtés en thème sombre :
 *   .role-admin → #fca5a5 sur #fecaca = 1,31:1 (WCAG AA exige 4,5:1) — illisible.
 *
 * Ce test n'inspecte pas un rendu (jsdom n'applique pas la cascade de fichiers
 * CSS séparés) : il vérifie la RÈGLE à la source — fond et texte d'un badge
 * doivent venir de la même paire sémantique `--X-bg` / `--X-text`, qui varie
 * solidairement d'un thème à l'autre.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BADGE_FILE = 'src/components/dashboard/DashboardRecentUsers.vue'

/**
 * Paires fond/texte ADAPTATIVES : chaque token y est redéfini dans _theme-light.css
 * ET _theme-dark.css, donc les deux côtés basculent ensemble. Toute autre
 * combinaison (notamment un token de _tokens-palette.css, à valeur unique) est
 * refusée : c'est elle qui produit le contraste cassé en thème sombre.
 */
const ADAPTIVE_PAIRS = {
  success: ['--success-bg', '--success-text'],
  warning: ['--warning-bg', '--warning-text'],
  error: ['--error-bg', '--error-text'],
  info: ['--info-bg', '--info-text'],
  neutral: ['--bg-tertiary', '--text-secondary'],
}

const source = readFileSync(resolve(process.cwd(), BADGE_FILE), 'utf8')

/** Extrait les règles `.role-*` et leurs déclarations background/color. */
function extractRoleRules(css) {
  const rules = []
  const re = /\.(role-[a-z-]+)\s*\{([^}]*)\}/g
  let match
  while ((match = re.exec(css)) !== null) {
    const [, selector, body] = match
    const bg = body.match(/background(?:-color)?:\s*var\((--[a-z0-9-]+)/i)?.[1] ?? null
    const color = body.match(/(?:^|[;{\s])color:\s*var\((--[a-z0-9-]+)/i)?.[1] ?? null
    rules.push({ selector, bg, color })
  }
  return rules
}

/** Nom de la paire adaptative portant ce token en position `bg` ou `text`. */
function familyOf(token, slot) {
  if (!token) return null
  const index = slot === 'bg' ? 0 : 1
  const hit = Object.entries(ADAPTIVE_PAIRS).find(([, pair]) => pair[index] === token)
  return hit ? hit[0] : null
}

const FAMILY_NAMES = Object.keys(ADAPTIVE_PAIRS).join(', ')

describe('badges de rôle — appariement des tokens (contraste en thème sombre)', () => {
  const rules = extractRoleRules(source)

  it('trouve bien les règles de badge à contrôler', () => {
    expect(rules.length).toBeGreaterThanOrEqual(4)
  })

  it.each(rules.map(r => [r.selector, r]))(
    '%s : fond et texte proviennent de la MÊME paire sémantique',
    (_selector, rule) => {
      expect(rule.bg, `${rule.selector} doit poser un background via var(--token)`).toBeTruthy()
      expect(rule.color, `${rule.selector} doit poser une color via var(--token)`).toBeTruthy()

      const bgFamily = familyOf(rule.bg, 'bg')
      const colorFamily = familyOf(rule.color, 'text')

      // Un token de palette (--red-200, --amber-800, --emerald-100…) ne bascule
      // pas avec le thème : l'apparier à un token adaptatif casse le contraste.
      expect(
        bgFamily,
        `${rule.selector}: « ${rule.bg} » n'est pas un fond adaptatif (paires : ${FAMILY_NAMES})`
      ).not.toBeNull()
      expect(
        colorFamily,
        `${rule.selector}: « ${rule.color} » n'est pas une couleur de texte adaptative`
      ).not.toBeNull()

      expect(
        colorFamily,
        `${rule.selector}: fond « ${rule.bg} » et texte « ${rule.color} » appartiennent à deux paires différentes`
      ).toBe(bgFamily)
    }
  )
})
