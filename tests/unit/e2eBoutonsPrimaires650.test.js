// @vitest-environment node
/**
 * #650 — l'outil E2E des boutons primaires (e2e/parcours-boutons-primaires.mjs) : ses jugements sont purs, ses dix
 * boutons visibles sont ceux de l'issue, et chacun vise un sélecteur que son composant porte vraiment.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOUTONS, CONTRASTE_MIN, ETAPES_BOUTONS, contraste, jugerBouton, lireCouleur } from '../../e2e/parcours-boutons-primaires.mjs'

const lire = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')
const BLANC = 'rgb(255, 255, 255)'

describe('#650 — juger un bouton', () => {
  it('lit rgb() et rgba()', () => {
    expect(lireCouleur('rgb(59, 130, 246)')).toEqual({ r: 59, g: 130, b: 246, a: 1 })
    expect(lireCouleur('rgba(0, 0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0, a: 0 })
    expect(lireCouleur('transparent')).toBeNull()
  })

  it('le contraste WCAG : blanc sur noir 21:1, blanc sur blanc 1:1', () => {
    expect(contraste({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })).toBeCloseTo(21, 5)
    expect(contraste({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 })).toBe(1)
  })

  it('le défaut de #650 : un fond TRANSPARENT sous un texte blanc est un écart', () => {
    const r = jugerBouton({ fond: 'rgba(0, 0, 0, 0)', texte: BLANC })
    expect(r.confirme).toBe(false)
    expect(r.ecart).toMatch(/TRANSPARENT/)
  })

  it('le jeton lu après la correction (blue-500) sous un texte blanc : visible, au-dessus de 3:1', () => {
    expect(jugerBouton({ fond: 'rgb(59, 130, 246)', texte: BLANC })).toMatchObject({ confirme: true })
    expect(CONTRASTE_MIN).toBe(3)
  })

  it('un fond opaque mais trop pâle sous un texte blanc : écart de contraste', () => {
    expect(jugerBouton({ fond: 'rgb(240, 240, 240)', texte: BLANC }).ecart).toMatch(/contraste/)
  })
})

describe('#650 — les dix boutons visibles de l’issue', () => {
  it('dix clés distinctes, une étape chacune', () => {
    expect(new Set(BOUTONS.map((b) => b.cle)).size).toBe(10)
    expect(ETAPES_BOUTONS.map((e) => e.cle)).toEqual(BOUTONS.map((b) => b.cle))
  })

  it.each([
    ['src/views/admin/AdminSeances.vue', 'retry-btn'],
    ['src/views/admin/AdminStats.vue', 'retry-btn'],
    ['src/views/admin/AdminVisio.vue', 'retry-btn'],
    ['src/views/teacher/TeacherMatieres.vue', 'error-retry-btn'],
    ['src/components/widgets/CalendarWidget.vue', 'view-btn'],
    ['src/components/widgets/CalendarEventModal.vue', 'action-btn primary'],
    ['src/components/teacher/MatiereCourseCard.vue', 'course-btn'],
    ['src/components/teacher/DashboardMatieresList.vue', 'course-btn'],
    ['src/components/admin/SeancesList.vue', 'action-btn primary'],
    ['src/components/admin/VisioGrid.vue', 'action-btn primary'],
  ])('%s porte la classe « %s » visée par l’outil', (fichier, classe) => {
    expect(lire(fichier)).toContain(`class="${classe}"`)
  })

  it('TeacherDashboard n’a aucun bouton « Réessayer » (sa règle est morte) : rien à mesurer', () => {
    expect(lire('src/views/dashboards/TeacherDashboard.vue')).not.toMatch(/<button[^>]*error-retry-btn/)
    expect(BOUTONS.some((b) => b.chemin === '/teacher/dashboard' && b.panne)).toBe(false)
  })

  it('le registre des parcours fonctionnels joue cette fonction, avec le dossier de sortie', () => {
    const registre = lire('e2e/parcours-fonctionnels.mjs')
    expect(registre).toContain("import { ETAPES_BOUTONS, DONNEES_BOUTONS } from './parcours-boutons-primaires.mjs'")
    expect(registre).toMatch(/const ctx = \{ pages, base: BASE, sortie, jeu,/)
  })
})
