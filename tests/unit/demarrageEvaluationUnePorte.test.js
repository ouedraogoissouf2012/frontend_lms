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

describe('démarrer une évaluation : une seule porte', () => {
  it('seul useStartEvaluation appelle le démarrage du service', () => {
    expect(fichiers(/\.startEvaluation\(/).filter((f) => f !== 'services/evaluation.js'))
      .toEqual(['composables/useStartEvaluation.js'])
  })

  it('aucun écran ne fabrique le chemin de la page de passage', () => {
    expect(fichiers(/evaluations\/\$\{[^}]+\}\/take/)).toEqual([])
  })
})
