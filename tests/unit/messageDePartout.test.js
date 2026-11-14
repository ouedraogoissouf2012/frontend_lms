// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * R6 (constat de relecture) : `messageDe(err)` (services/errorHandler) est LA règle du message montré —
 * le `userMessage` du catalogue, sinon celui de `normalizeError`, jamais le texte du serveur (D0). 25
 * sites la réécrivaient à la main (`err.userMessage ?? normalizeError(err).userMessage`). Ils l'appellent
 * désormais ; cette garde empêche le retour du motif réécrit.
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

describe('messageDe partout — le motif réécrit ne revient pas', () => {
  it('aucun fichier de src ne réécrit messageDe (`userMessage ?? normalizeError(…)`)', () => {
    const sites = fichiers(racine)
      .filter((p) => !p.endsWith(`services${sep}errorHandler.js`))
      .filter((p) => REECRIT.test(readFileSync(p, 'utf8')))
      .map((p) => relative(racine, p).split(sep).join('/'))
    expect(sites).toEqual([])
  })

  it('la garde reconnaît le motif (elle n’est pas aveugle)', () => {
    expect(REECRIT.test('error.value = err.userMessage ?? normalizeError(err).userMessage')).toBe(true)
    expect(REECRIT.test('error.value = messageDe(err)')).toBe(false)
  })
})
