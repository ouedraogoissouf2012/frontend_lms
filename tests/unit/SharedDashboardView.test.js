/**
 * Test de montage de la vue partagée `@/views/Dashboard.vue` (route `/dashboard`).
 *
 * Régression couverte : la vue comparait le rôle BRUT à `'étudiant'` (accentué)
 * et à `'enseignant'`. Les alias réellement émis par le backend/KLASSCI
 * (`student`, `etudiant`, `teacher`…) ne déclenchaient donc AUCUN chargement de
 * statistiques, silencieusement. La décision passe désormais par les helpers
 * normalisés de `@/constants/roles`.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  student: vi.fn(),
  teacher: vi.fn(),
  lessonsAll: vi.fn(),
  notifsAll: vi.fn(),
}))

vi.mock('@/services/api', () => ({
  auth: { getUser: h.getUser },
  dashboard: { getStudentDashboard: h.student, getTeacherDashboard: h.teacher },
  lessons: { getAll: h.lessonsAll },
  notifications: { getAll: h.notifsAll },
}))

import Dashboard from '@/views/Dashboard.vue'

const stubs = {
  // La vue est désormais enveloppée dans DashboardLayout (F2, fin de la Navbar
  // legacy) : on le stube au rendu de son slot pour isoler le contenu testé.
  DashboardLayout: { template: '<div><slot /></div>' },
  ContentLoader: { template: '<div class="loader" />' },
}

async function mountDashboard(role) {
  h.getUser.mockReturnValue(role === null ? null : { nom: 'Test', role })
  const w = mount(Dashboard, { global: { stubs } })
  await flushPromises()
  return w
}

describe('Dashboard.vue (route partagée) — rôle normalisé', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.student.mockResolvedValue({ lessons_in_progress: 3 })
    h.teacher.mockResolvedValue({ lessons_in_progress: 7 })
    h.lessonsAll.mockResolvedValue([])
    h.notifsAll.mockResolvedValue([])
  })

  it.each(['etudiant', 'étudiant', 'student'])(
    'rôle « %s » → charge le tableau de bord étudiant',
    async (role) => {
      await mountDashboard(role)
      expect(h.student).toHaveBeenCalledTimes(1)
      expect(h.teacher).not.toHaveBeenCalled()
    },
  )

  it.each(['enseignant', 'teacher'])(
    'rôle « %s » → charge le tableau de bord enseignant',
    async (role) => {
      await mountDashboard(role)
      expect(h.teacher).toHaveBeenCalledTimes(1)
      expect(h.student).not.toHaveBeenCalled()
    },
  )

  it('affiche les statistiques renvoyées pour un étudiant', async () => {
    const w = await mountDashboard('student')
    expect(w.text()).toContain('3')
    expect(w.text()).toContain('Leçons en cours')
  })

  it.each(['admin', 'coordinateur', 'inconnu', null])(
    'rôle « %s » → aucun tableau de bord étudiant/enseignant chargé',
    async (role) => {
      await mountDashboard(role)
      expect(h.student).not.toHaveBeenCalled()
      expect(h.teacher).not.toHaveBeenCalled()
    },
  )

  it('réponse vide → la vue rend quand même les cartes (pas de crash)', async () => {
    h.student.mockResolvedValue(null)
    const w = await mountDashboard('etudiant')
    expect(w.text()).toContain('Progression globale')
    expect(w.text()).toContain('0')
  })

  it('charge leçons récentes et notifications, quel que soit le rôle', async () => {
    await mountDashboard('teacher')
    expect(h.lessonsAll).toHaveBeenCalledWith({ limit: 5 })
    expect(h.notifsAll).toHaveBeenCalledWith({ limit: 5 })
  })
})
