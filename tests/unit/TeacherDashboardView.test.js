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

const readCache = vi.fn()
const writeCache = vi.fn()
vi.mock('@/services/cache', () => ({
  readCache: (...a) => readCache(...a),
  writeCache: (...a) => writeCache(...a)
}))

vi.mock('@/services/api', () => ({
  auth: { getUser: () => ({ role: 'enseignant', nom: 'Doe', prenom: 'Jane' }) }
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
      }
    }
  })
}

describe('TeacherDashboard.vue (G9) — montage', () => {
  beforeEach(() => {
    klassci.getTeacherDashboard.mockReset()
    readCache.mockReset()
    writeCache.mockReset()
    pushMock.mockReset()
  })

  it('cache vide → appelle getTeacherDashboard et écrit le cache', async () => {
    readCache.mockReturnValue(null)
    klassci.getTeacherDashboard.mockResolvedValue({ matieres: [], classes: [] })
    const w = mountDash()
    await flushPromises()

    expect(w.exists()).toBe(true)
    expect(klassci.getTeacherDashboard).toHaveBeenCalled()
    expect(writeCache).toHaveBeenCalledWith('teacher_dashboard', { matieres: [], classes: [] })
  })

  it('cache présent → ne rappelle pas l\'API', async () => {
    readCache.mockReturnValue({ matieres: [{ id: 1 }] })
    const w = mountDash()
    await flushPromises()

    expect(w.exists()).toBe(true)
    expect(klassci.getTeacherDashboard).not.toHaveBeenCalled()
  })
})
