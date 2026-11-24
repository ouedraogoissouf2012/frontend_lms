/**
 * #628 — les captures SOMBRES des écrans de calendrier, pour les paires avant/après FullCalendar 7 : les mêmes écrans,
 * des noms stables (la capture claire du parcours, suffixée `_sombre`), et des chemins qui sont de vraies routes.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CALENDRIERS, nomSombre } from '../../e2e/captures.mjs'

const routes = ['admin', 'student', 'teacher'].map((f) => readFileSync(resolve(process.cwd(), `src/router/routes/${f}.routes.js`), 'utf8')).join('\n')

describe('#628 — captures sombres des calendriers', () => {
  it('trois écrans : l’agenda enseignant, l’agenda élève, le tableau de bord admin (widget)', () => {
    expect(CALENDRIERS).toEqual(['/teacher/schedule', '/student/schedule', '/admin/dashboard'])
  })

  it('chaque écran est une vraie route du routeur', () => {
    for (const chemin of CALENDRIERS) expect(routes).toContain(`path: '${chemin}'`)
  })

  it('le nom sombre est le nom clair suffixé, pour des paires stables entre v6 et v7', () => {
    expect(nomSombre('captures/enseignant_teacher_schedule.png')).toBe('captures/enseignant_teacher_schedule_sombre.png')
  })

  it('le parcours des écrans appelle la capture sombre juste après la claire', () => {
    const parcours = readFileSync(resolve(process.cwd(), 'e2e/parcours.mjs'), 'utf8')
    const claire = parcours.indexOf('await page.screenshot({ path: join(sortie, capture) })')
    const sombre = parcours.indexOf('if (CALENDRIERS.includes(route.chemin)) await captureSombre(page, join(sortie, nomSombre(capture)))')
    expect(claire).toBeGreaterThan(0)
    expect(sombre).toBeGreaterThan(claire)
  })
})
