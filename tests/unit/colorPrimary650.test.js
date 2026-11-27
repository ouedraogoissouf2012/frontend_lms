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

// Mesure de l'E2E de 4c2cf974 : en SOMBRE, `--primary-color` vaut blue-400 (#60a5fa), un accent pour du texte sur fond
// sombre ; sous un texte blanc, le contraste tombe à 2.54:1 (3:1 exigé). Un FOND de bouton au texte blanc lit donc
// `--color-info-strong` (#2563eb, le même dans les deux thèmes : 5.17:1 sous du blanc).
const BOUTONS = [
  'src/components/admin/SeancesList.vue', 'src/components/admin/VisioGrid.vue', 'src/components/teacher/DashboardMatieresList.vue',
  'src/components/teacher/MatiereCourseCard.vue', 'src/components/widgets/CalendarEventModal.vue', 'src/components/widgets/CalendarWidget.vue',
  'src/views/admin/AdminSeances.vue', 'src/views/admin/AdminStats.vue', 'src/views/admin/AdminVisio.vue',
  'src/views/dashboards/TeacherDashboard.vue', 'src/views/teacher/TeacherMatieres.vue',
]

describe('#650 — un fond de bouton au texte blanc tient en clair ET en sombre', () => {
  it.each(BOUTONS)('%s : aucun fond sur `--primary-color` (accent pâle en sombre)', (f) => {
    expect(lire(f)).not.toMatch(/background(-color)?:\s*var\(--primary-color\)/)
  })

  it('`--color-info-strong` est défini une fois, et le thème sombre ne le redéfinit pas', () => {
    expect(lire('src/assets/styles/theme/_tokens-semantic.css')).toMatch(/--color-info-strong:\s*#2563eb;/)
    expect(lire('src/assets/styles/theme/_theme-dark.css')).not.toMatch(/--color-info-strong\s*:/)
  })
})
