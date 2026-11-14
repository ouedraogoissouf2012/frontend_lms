// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * État mort retiré (décision de la superviseure, 14/11) : `participantCount` et
 * `loadParticipantCount` (useVisioActions) lisaient `data.total` alors que le serveur rend
 * `total_participants` (SeanceDetailQueryService:209). Mais leur seul appel (VisioManager) était
 * commenté depuis 1b6276d7 (« cause erreur 500 ») et aucun gabarit ne les rendait : un compteur
 * jamais vu. On le retire au lieu de soigner du code mort. Réactiver un compteur est une question
 * produit (file), pas un correctif. Cette garde empêche le retour de l'état mort.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const racine = fileURLToPath(new URL('../../src', import.meta.url))
const fichiers = (dossier) => readdirSync(dossier).flatMap((n) => {
  const p = join(dossier, n)
  return statSync(p).isDirectory() ? fichiers(p) : /\.(js|vue)$/.test(n) ? [p] : []
})
const citent = (motif) => fichiers(racine)
  .filter((p) => motif.test(readFileSync(p, 'utf8')))
  .map((p) => relative(racine, p).split(sep).join('/'))

describe('visio — le compteur de participants mort est retiré', () => {
  it('aucun fichier de src ne déclare ni n’appelle participantCount ou loadParticipantCount', () => {
    expect(citent(/\bparticipantCount\b|\bloadParticipantCount\b/)).toEqual([])
  })

  it('la garde voit bien un fichier qui les citerait (elle n’est pas aveugle)', () => {
    expect(/\bloadParticipantCount\b/.test('this.loadParticipantCount()')).toBe(true)
    expect(citent(/\buseVisioActions\b/).length).toBeGreaterThan(0)
  })
})
