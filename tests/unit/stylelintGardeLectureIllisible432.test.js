// @vitest-environment node
/**
 * #432 — la garde couleurs (#161) ÉCHOUE quand stylelint n'a pas pu lire ou appliquer sa règle.
 *
 * `scripts/lint-css.mjs` ne retenait que les avertissements `color-no-hex` et jetait tous les autres
 * sans bruit. Trois cas mesurés (stylelint 17, le 23/11) sortaient en code 0, « ✔ No new hardcoded
 * colors », y compris en `--update`, qui gelait alors une baseline lue à moitié :
 *   1. un fichier illisible : un `.vue` sans `customSyntax` ne rend qu'un avertissement `CssSyntaxError` ;
 *   2. une option de règle invalide : stylelint ne lance pas la règle et le dit dans `invalidOptionWarnings` ;
 *   3. une règle inconnue (renommée ou retirée par une montée) : un avertissement « Unknown rule ».
 * Le 3ᵉ a été mesuré en écrivant ce correctif. Même cause que les deux autres (le `continue` sur toute
 * règle autre que `color-no-hex`), donc même correctif.
 *
 * Deux niveaux : la fonction pure qui recense ce qui n'a pas été lu, puis le VRAI script lancé dans un
 * dépôt jetable (dossier temporaire, sa propre configuration, sa baseline vide).
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import * as helpers from '../../scripts/lib/colorGuardHelpers.mjs'

const SCRIPT = resolve(process.cwd(), 'scripts/lint-css.mjs')
const RULE = 'color-no-hex'
const dossiers = []

afterAll(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true })
})

// Un dépôt jetable : sa configuration stylelint, une baseline vide, et ses fichiers sous src/.
function depot(config, fichiers) {
  const racine = mkdtempSync(join(tmpdir(), 'garde-432-'))
  dossiers.push(racine)
  writeFileSync(join(racine, '.stylelintrc.json'), JSON.stringify(config))
  writeFileSync(join(racine, '.stylelint-color-baseline.json'), '{}\n')
  for (const [nom, contenu] of Object.entries(fichiers)) {
    mkdirSync(join(racine, 'src'), { recursive: true })
    writeFileSync(join(racine, 'src', nom), contenu)
  }
  return racine
}

function garde(racine, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: racine, encoding: 'utf8' })
  return { code: r.status, sortie: `${r.stdout}${r.stderr}`, baseline: readFileSync(join(racine, '.stylelint-color-baseline.json'), 'utf8') }
}

const VUE = '<template><p>Texte fictif</p></template>\n<style scoped>\n.a { color: #abc; }\n</style>\n'
const COULEUR = '.a { color: #abc; }\n'

describe('#432 — unreadableReports : ce que stylelint n’a pas lu ou pas appliqué', () => {
  const resultat = (extra) => ({ source: '/d/src/a.vue', warnings: [], parseErrors: [], invalidOptionWarnings: [], ...extra })

  it('est exportée par les helpers de la garde', () => {
    expect(typeof helpers.unreadableReports).toBe('function')
  })

  it('un avertissement CssSyntaxError est recensé, avec sa position', () => {
    const r = resultat({ warnings: [{ rule: 'CssSyntaxError', line: 4, column: 1, text: 'Unknown word </style> (CssSyntaxError)' }] })
    expect(helpers.unreadableReports([r], RULE)).toEqual([
      { source: '/d/src/a.vue', line: 4, column: 1, reason: 'Unknown word </style> (CssSyntaxError)' },
    ])
  })

  it('une option invalide et une erreur d’analyse sont recensées', () => {
    const r = resultat({
      invalidOptionWarnings: [{ text: 'Unexpected option value "oui" for rule "color-no-hex"' }],
      parseErrors: [{ line: 2, column: 3, text: 'erreur fictive' }],
    })
    expect(helpers.unreadableReports([r], RULE)).toEqual([
      { source: '/d/src/a.vue', line: 2, column: 3, reason: 'erreur fictive' },
      { source: '/d/src/a.vue', line: 0, column: 0, reason: 'Unexpected option value "oui" for rule "color-no-hex"' },
    ])
  })

  it('une règle inconnue est recensée ; un avertissement de la règle de la garde ne l’est pas', () => {
    const r = resultat({
      warnings: [
        { rule: 'color-no-hex', line: 3, column: 13, text: 'Disallowed hex color "#abc" (color-no-hex)' },
        { rule: 'color-no-hex-renommee', line: 1, column: 1, text: 'Unknown rule color-no-hex-renommee.' },
      ],
    })
    expect(helpers.unreadableReports([r], RULE)).toEqual([
      { source: '/d/src/a.vue', line: 1, column: 1, reason: 'Unknown rule color-no-hex-renommee.' },
    ])
  })

  it('un résultat propre, ou ignoré, ne recense rien', () => {
    expect(helpers.unreadableReports([resultat(), { source: '/d/t.css', ignored: true, warnings: [] }], RULE)).toEqual([])
  })
})

describe('#432 — le vrai script échoue quand stylelint n’a pas lu', () => {
  it('un .vue illisible : code 1, le fichier est nommé, aucun « ✔ »', () => {
    const r = garde(depot({ rules: { [RULE]: true } }, { 'a.vue': VUE }))
    expect(r.code).toBe(1)
    expect(r.sortie).toContain('src/a.vue')
    expect(r.sortie).toContain('CssSyntaxError')
    expect(r.sortie).not.toContain('✔')
  })

  it('en --update aussi : code 1, et la baseline n’est PAS régénérée', () => {
    const r = garde(depot({ rules: { [RULE]: true } }, { 'a.vue': VUE }), '--update')
    expect(r.code).toBe(1)
    expect(r.baseline).toBe('{}\n')
    expect(r.sortie).not.toContain('Baseline regenerated')
  })

  it('une option invalide (la règle ne tourne pas) : code 1', () => {
    const r = garde(depot({ rules: { [RULE]: 'oui' } }, { 'b.css': COULEUR }))
    expect(r.code).toBe(1)
    expect(r.sortie).toContain('Unexpected option value')
  })

  it('une règle inconnue (renommée par une montée) : code 1', () => {
    const r = garde(depot({ rules: { 'color-no-hex-renommee': true } }, { 'b.css': COULEUR }))
    expect(r.code).toBe(1)
    expect(r.sortie).toContain('color-no-hex-renommee')
  })
})

describe('#432 — témoins : la garde lisible garde son comportement', () => {
  it('un repli var(--x, #abc) lisible passe, code 0', () => {
    const r = garde(depot({ rules: { [RULE]: true } }, { 'c.css': '.a { color: var(--x, #abc); }\n' }))
    expect(r.code).toBe(0)
    expect(r.sortie).toContain('✔ No new hardcoded colors')
  })

  it('un #abc nu lisible échoue comme avant, en couleur nouvelle', () => {
    const r = garde(depot({ rules: { [RULE]: true } }, { 'b.css': COULEUR }))
    expect(r.code).toBe(1)
    expect(r.sortie).toContain('new hardcoded color')
    expect(r.sortie).toContain('src/b.css')
  })
})
