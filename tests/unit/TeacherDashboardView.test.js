/**
 * Test de MONTAGE de TeacherDashboard.vue (G9 — fichier déjà < 300, vérif parité).
 *
 * Confirme que la vue monte sans erreur, lit le cache puis appelle
 * klassciService.getTeacherDashboard quand le cache est vide (parité de câblage).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted : initialise le mock avant le hoisting de vi.mock.
const { klassci } = vi.hoisted(() => ({ klassci: { getTeacherDashboard: vi.fn() } }))
vi.mock('@/services/klassci', () => ({ klassciService: klassci }))

const { lms } = vi.hoisted(() => ({
  lms: { getEnseignants: vi.fn(), getMyMatieres: vi.fn(), getMyTeachingSeances: vi.fn() }
}))
vi.mock('@/services/lms', () => ({ default: lms }))

const clearCache = vi.fn()
const readCache = vi.fn()
const writeCache = vi.fn()
vi.mock('@/services/cache', () => ({
  clearCache: (...a) => clearCache(...a),
  readCache: (...a) => readCache(...a),
  writeCache: (...a) => writeCache(...a)
}))

const apiDashboard = vi.fn()
vi.mock('@/services/api', () => ({
  auth: { getUser: () => ({ role: 'enseignant', nom: 'Doe', prenom: 'Jane' }) },
  dashboard: { getTeacherDashboard: (...a) => apiDashboard(...a) },
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushMock }) }))

import TeacherDashboard from '@/views/dashboards/TeacherDashboard.vue'

function mountDash() {
  return mount(TeacherDashboard, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      },
      directives: { reveal: {} } // directive globale v-reveal (no-op en test)
    }
  })
}

describe('TeacherDashboard.vue (G9) — montage', () => {
  beforeEach(() => {
    klassci.getTeacherDashboard.mockReset()
    lms.getEnseignants.mockReset().mockResolvedValue({ success: true, data: [] })
    lms.getMyMatieres.mockReset().mockResolvedValue({ success: true, data: [] })
    lms.getMyTeachingSeances.mockReset().mockResolvedValue({ data: [] })
    apiDashboard.mockReset().mockResolvedValue(null)
    clearCache.mockReset()
    readCache.mockReset()
    writeCache.mockReset()
    pushMock.mockReset()
    // count-up des stat cards : mouvement réduit → valeurs finales, aucune animation en test
    window.matchMedia = vi.fn(() => ({ matches: true, media: '', addEventListener() {}, removeEventListener() {} }))
  })

  it('cache vide → appelle getTeacherDashboard et écrit le cache', async () => {
    readCache.mockReturnValue(null)
    klassci.getTeacherDashboard.mockResolvedValue({ matieres: [{ id: 1 }], classes: [] })
    const w = mountDash()
    await flushPromises()

    expect(w.exists()).toBe(true)
    expect(klassci.getTeacherDashboard).toHaveBeenCalled()
    expect(writeCache).toHaveBeenCalledWith('teacher_dashboard', expect.objectContaining({
      matieres: [{ id: 1 }],
      classes: [],
      evaluations: [],
      seances: [],
      statistiques: {},
    }))
  })

  it('cache vide et réponse vide → ne cache pas un dashboard sans contenu', async () => {
    readCache.mockReturnValue(null)
    klassci.getTeacherDashboard.mockResolvedValue({ matieres: [], classes: [] })
    const w = mountDash()
    await flushPromises()

    expect(w.exists()).toBe(true)
    expect(klassci.getTeacherDashboard).toHaveBeenCalled()
    expect(writeCache).not.toHaveBeenCalled()
  })

  it('cache présent → ne rappelle pas l\'API', async () => {
    readCache.mockReturnValue({ matieres: [{ id: 1 }] })
    const w = mountDash()
    await flushPromises()

    expect(w.exists()).toBe(true)
    expect(klassci.getTeacherDashboard).not.toHaveBeenCalled()
  })
})
