// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * R6 (constat de relecture) : `messageDe(err)` (services/errorHandler) est LA règle du message montré —
 * le `userMessage` du catalogue, sinon celui de `normalizeError`, jamais le texte du serveur (D0). 25
 * sites dans 15 fichiers la réécrivaient à la main (`err.userMessage ?? normalizeError(err).userMessage`).
 *
 * Cliquet : 10 fichiers l'appellent désormais. Les 5 fichiers GELÉS ci-dessous gardent la réécriture,
 * dette déclarée : leurs tests existants mockent `@/services/errorHandler` avec un seul
 * `normalizeError` (sans `messageDe`, ou avec le `messageDe` d'origine qui n'appelle pas le mock). Les
 * passer à `messageDe` changerait ces tests, ce que R6 exclut. La liste ne peut que rétrécir.
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
const GELES = [
  'composables/useChapterManager.js',
  'composables/useLessonChapters.js',
  'composables/useParticipantsModal.js',
  'composables/useSeanceCreate.js',
  'composables/useSeanceDetails.js',
]

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
