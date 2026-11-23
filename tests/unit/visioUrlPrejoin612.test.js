// @vitest-environment node
/**
 * #612 : `buildJitsiUrl` n'avait plus aucun appelant depuis la salle embarquée (#673), mais elle gardait un piège.
 * Avec `prejoinDisabled`, elle posait `config.prejoinConfig.enabled=false` dans le fragment de l'URL. HORS iframe,
 * Jitsi en déduit `disableInitialGUM=true` (relevé dans le bundle servi, v=9365) : l'utilisateur entre sans micro
 * ni caméra. Le vrai chemin passe par `buildRoomConfigFromResponse`, puis `configOverwrite` dans `VisioRoom.vue`.
 * Ces gardes lisent le SOURCE : elles affirment une absence, ce qu'aucun test de comportement ne peut constater.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as visio from '@/constants/visio'

const SRC = resolve(process.cwd(), 'src')

/** Les fichiers .js et .vue de src, hors dossiers de tests. */
function fichiersSrc() {
  const trouves = []
  const parcourir = (dossier) => {
    for (const entree of readdirSync(dossier)) {
      const chemin = join(dossier, entree)
      if (statSync(chemin).isDirectory()) {
        if (entree !== '__tests__') parcourir(chemin)
        continue
      }
      if (/\.(js|vue)$/.test(entree)) trouves.push(relative(SRC, chemin).replace(/\\/g, '/'))
    }
  }
  parcourir(SRC)
  return trouves
}

const FICHIERS = fichiersSrc()
const contenu = (relatif) => readFileSync(join(SRC, relatif), 'utf8')

/** Le CODE seul : un commentaire qui explique pourquoi la surcharge a disparu n'est pas une construction d'URL. */
const code = (relatif) => contenu(relatif)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

describe('#612 — aucune URL de salle ne porte la surcharge prejoin', () => {
  it('le périmètre lu n’est pas vide (sinon chaque garde serait verte sans rien lire)', () => {
    expect(FICHIERS.length).toBeGreaterThan(100)
    expect(FICHIERS).toContain('constants/visio.js')
    expect(FICHIERS).toContain('components/visio/VisioRoom.vue')
  })

  it('aucun code de src ne construit `config.prejoinConfig.enabled=` (fragment ou query d’URL)', () => {
    expect(FICHIERS.filter((f) => /prejoinConfig\.enabled=/.test(code(f)))).toEqual([])
  })

  it('@/constants/visio n’exporte plus buildJitsiUrl ; la salle se décrit par une configuration', () => {
    expect('buildJitsiUrl' in visio).toBe(false)
    expect(typeof visio.buildRoomConfigFromResponse).toBe('function')
  })

  it('la configuration de la salle embarquée coupe toujours le pré-join, par configOverwrite', async () => {
    const { jitsiConfigOverwrite } = await import('@/constants/visioNetwork')
    expect(jitsiConfigOverwrite().prejoinConfig).toEqual({ enabled: false })
  })
})

describe('#612 — les journaux décrivent le chemin réel (salle embarquée)', () => {
  it('aucun journal ni commentaire de src ne décrit encore l’onglet séparé « window.open + tracking »', () => {
    const coupables = FICHIERS.filter((f) => /window\.open (\+|avec) tracking/.test(contenu(f)))
    expect(coupables).toEqual([])
  })
})
