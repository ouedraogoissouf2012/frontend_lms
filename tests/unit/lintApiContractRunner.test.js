// @vitest-environment node
/**
 * Le SCRIPT `lint-api-contract.mjs` doit mordre, pas seulement sa bibliothèque.
 *
 * `apiContract.test.js` prouve les règles, fonction par fonction. Il ne prouve
 * rien de ce que le script en fait : lire la baseline sur le disque, choisir son
 * code de sortie, nommer le couple fautif. Une baseline mal cadrée, jamais vue
 * mordre, passerait sans que rien ne le signale.
 *
 * Chaque cas lance donc le vrai script, dans un mini-dépôt front temporaire, et
 * lit ce qu'il rend : code de sortie et texte.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'lint-api-contract.mjs')

/** La spec ne documente qu'une opération : `GET /documente`. */
const SPEC = "openapi: 3.0.0\npaths:\n  /documente:\n    get:\n      responses:\n        '200':\n          description: ok\n"

const depots = []

/** Mini-dépôt : endpoints.js, un service qui appelle, la spec, la baseline. */
function depot({ appels, baseline }) {
  const racine = mkdtempSync(path.join(tmpdir(), 'garde-contrat-'))
  depots.push(racine)
  mkdirSync(path.join(racine, 'src', 'services'), { recursive: true })
  writeFileSync(
    path.join(racine, 'src', 'services', 'endpoints.js'),
    "export const endpoints = { documente: '/documente', nonDocumente: '/non-documente' }\n",
  )
  writeFileSync(
    path.join(racine, 'src', 'services', 'appels.js'),
    "import api from './api'\nimport { endpoints } from './endpoints'\n\n" +
      appels.map((cle, i) => `export const appel${i} = () => api.get(endpoints.${cle})\n`).join(''),
  )
  writeFileSync(path.join(racine, 'spec.yaml'), SPEC)
  writeFileSync(path.join(racine, '.api-contract-baseline.json'), `${JSON.stringify(baseline)}\n`)
  return racine
}

function garde(racine) {
  const r = spawnSync(process.execPath, [SCRIPT, '--spec', path.join(racine, 'spec.yaml')], { cwd: racine, encoding: 'utf8' })
  return { code: r.status, sortie: r.stdout, erreurs: r.stderr }
}

afterEach(() => {
  for (const d of depots.splice(0)) rmSync(d, { recursive: true, force: true })
})

describe('le script lint-api-contract mord', () => {
  it('rougit sur un appel non documenté, et nomme le couple et le site fautifs', () => {
    const r = garde(depot({ appels: ['documente', 'nonDocumente'], baseline: [] }))

    expect(r.code).toBe(1)
    expect(r.erreurs).toContain('1 appel(s) absent(s) de la spec du backend')
    expect(r.erreurs).toContain('src/services/appels.js:5  GET /non-documente')
    // Le couple documenté, lui, n'est pas accusé.
    expect(r.erreurs).not.toContain('GET /documente')
  })

  it('signale une dette remboursée comme à retirer, nommément', () => {
    // `GET /documente` est en dette, mais la spec la documente désormais.
    const r = garde(depot({ appels: ['documente'], baseline: ['GET /documente'] }))

    expect(r.code).toBe(0)
    expect(r.sortie).toContain('1 entrée(s) de dette remboursée(s), à retirer de .api-contract-baseline.json')
    expect(r.sortie).toContain('  - GET /documente')
  })

  it('témoin : la même dette, non remboursée, est tolérée sans bruit', () => {
    // Sans ce témoin, un script qui accuserait TOUT rendrait les deux cas
    // ci-dessus verts pour de mauvaises raisons.
    const r = garde(depot({ appels: ['documente', 'nonDocumente'], baseline: ['GET /non-documente'] }))

    expect(r.code).toBe(0)
    expect(r.sortie).toContain("OK Contrat d'API respecté")
    expect(r.sortie).not.toContain('remboursée')
    expect(r.erreurs).toBe('')
  })
})
