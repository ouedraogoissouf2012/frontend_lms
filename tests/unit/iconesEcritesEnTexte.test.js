// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * Une icône s'affiche comme une icône, jamais comme le nom de sa classe.
 *
 * Constat E2E (10/11/2026) : le tableau de bord générique (/dashboard) affichait « fa-book »,
 * « fa-check-circle » et « fa-bar-chart » en toutes lettres dans ses cartes. La barre d'outils de
 * l'éditeur de leçon écrivait « fa-bars » et « fa-play » dans ses boutons. FontAwesome est chargé
 * (`<i class="fa fa-…">` s'affiche ailleurs) : ces noms étaient du TEXTE au lieu d'une balise.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const racine = fileURLToPath(new URL('../../src', import.meta.url))
const vues = (dossier) => readdirSync(dossier).flatMap((n) => {
  const p = join(dossier, n)
  return statSync(p).isDirectory() ? vues(p) : n.endsWith('.vue') ? [p] : []
})

/** Le gabarit seul : ni le script, ni le style (un nom de classe y est légitime). */
const gabarit = (source) => source.match(/<template>([\s\S]*)<\/template>/)?.[1] ?? ''

// Un nom de classe FontAwesome en TEXTE : seul sur sa ligne, ou seul entre deux balises.
const NOM_EN_TEXTE = /^\s*fa-[a-z0-9-]+\s*$|>\s*fa-[a-z0-9-]+\s*</m

describe('aucune icône n’est écrite par le nom de sa classe', () => {
  it('aucun gabarit de src/ n’affiche « fa-… » en texte', () => {
    const fautifs = vues(racine)
      .filter((f) => NOM_EN_TEXTE.test(gabarit(readFileSync(f, 'utf8'))))
      .map((f) => relative(racine, f).split(sep).join('/'))
      .sort()
    expect(fautifs).toEqual([])
  })

  it('la garde voit bien le défaut (témoin)', () => {
    expect(NOM_EN_TEXTE.test(gabarit('<template><div>\n  fa-book\n</div></template>'))).toBe(true)
    expect(NOM_EN_TEXTE.test(gabarit('<template><button>fa-play</button></template>'))).toBe(true)
    expect(NOM_EN_TEXTE.test(gabarit('<template><i class="fa fa-book"></i></template>'))).toBe(false)
  })
})
