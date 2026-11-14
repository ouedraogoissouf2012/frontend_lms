// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * R6 (constat de relecture) : `messageDe(err)` (services/errorHandler) est LA règle du message montré —
 * le `userMessage` du catalogue, sinon celui de `normalizeError`, jamais le texte du serveur (D0). 25
 * sites dans 15 fichiers la réécrivaient à la main (`err.userMessage ?? normalizeError(err).userMessage`).
 *
 * Cliquet : les 15 fichiers qui la réécrivaient l'appellent. #538 en avait gelé 5, dont les tests mockaient
 * `@/services/errorHandler` avec un seul `normalizeError` ; #540 a migré ces mocks (`importOriginal`,
 * migration déclarée) et vidé la liste. Aucun fichier de `src` ne doit plus réécrire la règle.
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
const REECRIT = /userMessage\s*\?\?\s*normalizeError\(/
// Dette fermée le 14/11 : les 5 fichiers gelés appellent messageDe (leurs tests mockent désormais le vrai module).
const GELES = []

describe('messageDe partout — le motif réécrit ne revient pas', () => {
  it('seuls les fichiers gelés réécrivent encore messageDe (et tous le font encore : la liste rétrécit)', () => {
    const sites = fichiers(racine)
      .filter((p) => !p.endsWith(`services${sep}errorHandler.js`))
      .filter((p) => REECRIT.test(readFileSync(p, 'utf8')))
      .map((p) => relative(racine, p).split(sep).join('/'))
      .sort()
    expect(sites).toEqual(GELES)
  })

  it('la garde reconnaît le motif (elle n’est pas aveugle)', () => {
    expect(REECRIT.test('error.value = err.userMessage ?? normalizeError(err).userMessage')).toBe(true)
    expect(REECRIT.test('error.value = messageDe(err)')).toBe(false)
  })
})
