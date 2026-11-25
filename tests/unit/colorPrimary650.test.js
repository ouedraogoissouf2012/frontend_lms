// @vitest-environment node
/**
 * #650 — `--color-primary` n'est défini NULLE PART (ligne de base gelée de la garde #442). Lu SANS repli, il laisse
 * la déclaration à sa valeur initiale : `background: var(--color-primary)` donne un fond TRANSPARENT, et les onze
 * boutons peints ainsi, au texte blanc, étaient invisibles en thème clair (relevé à la répétition #647).
 *
 * Correction : les lectures SANS repli lisent `--primary-color`, le jeton défini dans les deux thèmes. Les lectures
 * AVEC repli (`var(--color-primary, #10b981)`) ne changent pas d'aspect et restent pour un autre ticket : la ligne de
 * base de la garde ne compte plus qu'elles.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const racine = process.cwd()
const lire = (f) => readFileSync(resolve(racine, f), 'utf8')

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) return fichiers(chemin)
    return /\.(vue|css|scss|js|ts)$/.test(nom) ? [chemin] : []
  })
}

const SOURCES = [...fichiers(resolve(racine, 'src')), resolve(racine, 'index.html')]
const lectures = (re) => SOURCES.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(re)].map(() => relative(racine, f).replaceAll('\\', '/')))

describe('#650 — `--color-primary` n’est plus lu sans repli', () => {
  it('aucune lecture `var(--color-primary)` SANS repli dans src/ ni index.html', () => {
    expect(lectures(/var\(\s*--color-primary\s*\)/g)).toEqual([])
  })

  it('le jeton lu à sa place, `--primary-color`, est défini dans le thème clair ET dans le sombre', () => {
    for (const f of ['src/assets/styles/theme/_theme-light.css', 'src/assets/styles/theme/_theme-dark.css']) {
      expect(lire(f)).toMatch(/^\s*--primary-color\s*:/m)
    }
  })

  it('la ligne de base de la garde ne compte plus que les lectures AVEC repli (inchangées)', () => {
    const avecRepli = lectures(/var\(\s*--color-primary\s*,/g).length
    expect(avecRepli).toBe(35)
    expect(JSON.parse(lire('.proprietes-non-definies-baseline.json'))['--color-primary']).toBe(avecRepli)
  })
})
