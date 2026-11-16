/**
 * #582, points 1 et 2 : l'enseignant ne pouvait pas REJOINDRE sa visio depuis son calendrier (TeacherSchedule gère
 * `joinVisio`, mais son pied d'événement ne l'émettait pas), trois cas de TeacherSchedule n'avaient aucun émetteur,
 * et `/teacher/visio-list` n'avait aucun lien. Le produit a unifié ce chemin pour l'élève (student.routes.js :
 * « remplace séances + visio-list ») : l'enseignant de même, son ancienne URL redirige vers son calendrier.
 */
import { mount } from '@vue/test-utils'
import { existsSync, readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import EventDetailActions from '@/components/calendar/EventDetailActions.vue'
import { teacherRoutes } from '@/router/routes/teacher.routes'

const SEANCE = { id: 9, visio: { enabled: true, status: 'active' } }
const pied = (props) => mount(EventDetailActions, { props: { userRole: 'teacher', isSeance: true, eventData: SEANCE, ...props } })
const rejoindre = (w) => w.findAll('button').find((b) => b.text().includes('Rejoindre la visio'))

describe('#582.1 — l’enseignant rejoint sa visio depuis le calendrier', () => {
  it('visio en cours : « Rejoindre la visio », qui émet joinVisio (géré par TeacherSchedule)', async () => {
    const w = pied({ canEndVisio: true })
    await rejoindre(w).trigger('click')
    expect(w.emitted('action')[0]).toEqual(['joinVisio'])
  })

  it('visio non démarrée : pas de « Rejoindre »', () => {
    expect(rejoindre(pied({ canEndVisio: false }))).toBeUndefined()
  })

  it('les cas sans émetteur sont retirés de TeacherSchedule ; joinVisio reste', () => {
    const source = readFileSync('src/views/teacher/TeacherSchedule.vue', 'utf8')
    expect(source).not.toMatch(/case 'viewAttendance'|case 'enableVisio'|case 'toggleVisio'/)
    expect(source).toContain("case 'joinVisio'")
  })
})

describe('#582.2 — /teacher/visio-list est remplacée par le calendrier de l’enseignant', () => {
  it('l’ancienne URL redirige vers /teacher/schedule (pas de 404)', () => {
    const route = teacherRoutes.find((r) => r.path === '/teacher/visio-list')
    expect(route.redirect).toBe('/teacher/schedule')
    expect(route.component).toBeUndefined()
  })

  it('la vue et ce qui ne servait qu’elle sont retirés', () => {
    for (const f of ['src/views/teacher/TeacherVisioList.vue', 'src/composables/useTeacherVisioList.js',
      'src/components/visio/VisioSeanceSection.vue', 'src/components/visio/VisioStatsCards.vue', 'src/components/visio/VisioSeanceCard.vue']) {
      expect(existsSync(f), f).toBe(false)
    }
  })
})
