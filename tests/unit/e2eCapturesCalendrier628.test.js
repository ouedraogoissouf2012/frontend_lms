/**
 * #628 — les captures SOMBRES des écrans de calendrier, pour les paires avant/après FullCalendar 7 : les mêmes écrans,
 * des noms stables (la capture claire du parcours, suffixée `_sombre`), et des chemins qui sont de vraies routes.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOUTON_CALENDRIER, CALENDRIERS, HAUTEUR_MAX, hauteurUtile, nomsPleinePage } from '../../e2e/captures.mjs'

const routes = ['admin', 'student', 'teacher'].map((f) => readFileSync(resolve(process.cwd(), `src/router/routes/${f}.routes.js`), 'utf8')).join('\n')

describe('#628 — captures sombres des calendriers', () => {
  it('trois écrans : l’agenda enseignant, l’agenda élève, le tableau de bord admin (widget)', () => {
    expect(CALENDRIERS).toEqual(['/teacher/schedule', '/student/schedule', '/admin/dashboard'])
  })

  it('chaque écran est une vraie route du routeur', () => {
    for (const chemin of CALENDRIERS) expect(routes).toContain(`path: '${chemin}'`)
  })

  it('la paire pleine page porte des noms stables entre v6 et v7, à côté de la capture du parcours', () => {
    expect(nomsPleinePage('captures/enseignant_teacher_schedule.png')).toEqual({
      clair: 'captures/enseignant_teacher_schedule_pleine_clair.png',
      sombre: 'captures/enseignant_teacher_schedule_pleine_sombre.png',
    })
  })

  it('la fenêtre est agrandie à TOUT le contenu de la zone défilante (le document, lui, ne défile pas)', () => {
    expect(hauteurUtile({ fenetre: 720, haut: 64, defilable: 1900 })).toBe(1964)
  })

  it('jamais moins que la fenêtre, jamais plus que le plafond, et sans zone mesurée la fenêtre d’origine', () => {
    expect(hauteurUtile({ fenetre: 720, haut: 64, defilable: 300 })).toBe(720)
    expect(hauteurUtile({ fenetre: 720, haut: 64, defilable: 90000 })).toBe(HAUTEUR_MAX)
    expect(hauteurUtile({ fenetre: 720, haut: null, defilable: null })).toBe(720)
  })

  it('le widget admin, chargé à la demande, est affiché par SON bouton avant la capture', () => {
    const panneau = readFileSync(resolve(process.cwd(), 'src/components/dashboard/DashboardCalendarPanel.vue'), 'utf8')
    expect(panneau).toContain(`'${BOUTON_CALENDRIER}'`)
  })

  it('le parcours des écrans appelle la paire pleine page juste après sa propre capture', () => {
    const parcours = readFileSync(resolve(process.cwd(), 'e2e/parcours.mjs'), 'utf8')
    const claire = parcours.indexOf('await page.screenshot({ path: join(sortie, capture) })')
    const sombre = parcours.indexOf('await capturesCalendrier(page, { clair: join(sortie, noms.clair), sombre: join(sortie, noms.sombre) })')
    expect(claire).toBeGreaterThan(0)
    expect(sombre).toBeGreaterThan(claire)
  })
})
