// @vitest-environment node
/**
 * #754 : la garde « aucune clé en double dans les catalogues » doit ROUGIR, sur la composition FINALE.
 *
 * En JavaScript, la dernière clé d'un objet gagne en silence : un message ou un motif peut disparaître sans qu'aucun
 * test ne rougisse. Mesuré le 28/11 : la configuration ESLint plate n'activait AUCUNE règle du cœur
 * (`@eslint/js` absent), donc pas `no-dupe-keys` ; et une règle par littéral ne voit de toute façon pas un doublon
 * qui arrive par un étalement (`...autre`) d'un autre module. La garde lit les catalogues comme du CODE (arbre
 * syntaxique), suit chaque étalement jusqu'à son module, et refuse ce qu'elle ne sait pas lire plutôt que de se taire.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ESLint } from 'eslint'
import { CATALOGUES, clesDuCatalogue, controlerLesCatalogues, doublons } from '../../scripts/lib/catalogues.mjs'

const RACINE = resolve(__dirname, '../..')

/** Un lecteur de fichiers en mémoire : `chemin => source`. */
const lecteur = (fichiers) => (chemin) => {
  if (!(chemin in fichiers)) throw new Error(`fichier absent : ${chemin}`)
  return fichiers[chemin]
}

describe('#754 — la garde attrape', () => {
  it('un doublon dans le littéral, avec ses deux origines', () => {
    const lire = lecteur({ 'src/a.js': "export const A = Object.freeze({\n  un: 'x',\n  deux: 'y',\n  un: 'z',\n})\n" })
    expect(doublons(clesDuCatalogue('src/a.js', 'A', lire))).toEqual([{ cle: 'un', origines: ['src/a.js:2', 'src/a.js:4'] }])
  })

  it('un doublon qui arrive par l’étalement d’un AUTRE module', () => {
    const lire = lecteur({
      'src/a.js': "import { B } from './b'\nexport const A = Object.freeze({\n  un: 'x',\n  ...B,\n})\n",
      'src/b.js': "export const B = {\n  deux: 'y',\n  un: 'z',\n}\n",
    })
    expect(doublons(clesDuCatalogue('src/a.js', 'A', lire))).toEqual([{ cle: 'un', origines: ['src/a.js:3', 'src/b.js:3'] }])
  })

  it('le long d’une chaîne d’étalements, et par l’alias @/', () => {
    const lire = lecteur({
      'src/a.js': "import { B } from '@/b'\nexport const A = { ...B, trois: 1 }\n",
      'src/b.js': "import { C } from './c.js'\nexport const B = { ...C }\n",
      'src/c.js': 'export const C = { trois: 2 }\n',
    })
    expect(doublons(clesDuCatalogue('src/a.js', 'A', lire)).map((d) => d.cle)).toEqual(['trois'])
  })

  it('une clé citée vaut la même clé nue', () => {
    const lire = lecteur({ 'src/a.js': "export const A = { 'un': 1, un: 2 }\n" })
    expect(doublons(clesDuCatalogue('src/a.js', 'A', lire)).map((d) => d.cle)).toEqual(['un'])
  })

  it('une composition qu’elle ne sait pas lire est REFUSÉE, jamais ignorée', () => {
    const lire = lecteur({ 'src/a.js': 'export const A = { ...fabriquer(), un: 1 }\n' })
    expect(() => clesDuCatalogue('src/a.js', 'A', lire)).toThrow(/illisible/)
  })
})

describe('#754 — la garde se tait', () => {
  it('sans doublon, aucun refus', () => {
    const lire = lecteur({ 'src/a.js': 'export const A = { un: 1, deux: 2 }\n' })
    expect(doublons(clesDuCatalogue('src/a.js', 'A', lire))).toEqual([])
  })

  it('les catalogues RÉELS du dépôt, dans leur composition finale', () => {
    expect(CATALOGUES.map((c) => c.fichier)).toEqual(['src/constants/errorMessages.js', 'src/services/refusalReasons.js'])
    expect(controlerLesCatalogues((chemin) => readFileSync(resolve(RACINE, chemin), 'utf8'))).toEqual([])
  })
})

describe('#754 — ESLint voit enfin un doublon littéral', () => {
  it('no-dupe-keys est actif sur src', async () => {
    const eslint = new ESLint({ cwd: RACINE })
    const [resultat] = await eslint.lintText("export const A = { un: 1, un: 2 }\n", { filePath: resolve(RACINE, 'src/constants/sonde754.js') })
    expect(resultat.messages.map((m) => m.ruleId)).toContain('no-dupe-keys')
  })
})
