// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * Une seule porte pour démarrer une évaluation : `composables/useStartEvaluation.js`.
 *
 * Constat de la revue de #514 : le calendrier de l'élève poussait directement vers la page de passage,
 * sans appeler `POST /evaluations/{id}/start`. Sans copie créée, l'écran disait « ID de soumission
 * manquant », et aucun motif de refus (#1011) ne pouvait s'afficher. Toute entrée doit passer par la
 * même fonction, qui appelle le serveur, ouvre la copie créée et dit le motif d'un refus.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const racine = fileURLToPath(new URL('../../src', import.meta.url))
const sources = (dossier) => readdirSync(dossier).flatMap((n) => {
  const p = join(dossier, n)
  return statSync(p).isDirectory() ? sources(p) : /\.(js|vue)$/.test(n) ? [p] : []
})
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/<!--[\s\S]*?-->/g, '')
const fichiers = (motif) => sources(racine)
  .filter((f) => motif.test(sansCommentaires(readFileSync(f, 'utf8'))))
  .map((f) => relative(racine, f).split(sep).join('/'))
  .sort()

const hors = (liste, ...permis) => liste.filter((f) => !permis.includes(f) && !f.startsWith('router/'))

// Revue de #515 : la première garde ne voyait que le chemin écrit en gabarit ; la page d'une matière
// passait par la route NOMMÉE et restait verte. Toutes les formes sont lues.
describe('ouvrir une évaluation (élève) : une seule porte', () => {
  it('seul useStartEvaluation appelle le démarrage du service (appel, déstructuration, crochets)', () => {
    const appel = /evaluationService\s*\.\s*startEvaluation\b|\{[^}]*\bstartEvaluation\b[^}]*\}\s*=\s*evaluationService|\[\s*['"]startEvaluation['"]\s*\]/
    expect(hors(fichiers(appel), 'services/evaluation.js')).toEqual(['composables/useStartEvaluation.js'])
  })

  it('seul le service connaît l’endpoint de démarrage', () => {
    expect(hors(fichiers(/evaluations\s*\.\s*start\b/), 'services/evaluation.js')).toEqual([])
  })

  it('seul useStartEvaluation ouvre la page de passage (route nommée)', () => {
    expect(hors(fichiers(/['"`]TakeEvaluation['"`]/))).toEqual(['composables/useStartEvaluation.js'])
  })

  it('aucun fichier ne fabrique le chemin de la page de passage (gabarit ou concaténation)', () => {
    expect(hors(fichiers(/\/take['"`]|evaluations\/\$\{[^}]+\}\/take/))).toEqual([])
  })

  it('la garde voit bien chaque forme (témoins)', () => {
    const voit = (re, code) => re.test(sansCommentaires(code))
    expect(voit(/['"`]TakeEvaluation['"`]/, "push({ name: 'TakeEvaluation' })")).toBe(true)
    expect(voit(/\/take['"`]/, "'/student/evaluations/' + id + '/take'")).toBe(true)
    expect(voit(/\{[^}]*\bstartEvaluation\b[^}]*\}\s*=\s*evaluationService/, 'const { startEvaluation } = evaluationService')).toBe(true)
    expect(voit(/['"`]TakeEvaluation['"`]/, "// name: 'TakeEvaluation'")).toBe(false)
  })
})
