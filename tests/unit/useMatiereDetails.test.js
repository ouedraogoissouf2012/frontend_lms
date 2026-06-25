/**
 * Test du composable useMatiereDetails (#H9). Services mockes, route injectee via
 * global.mocks (la vue reste pilotee par $route/$router). Les fonctions pures de
 * utils/matiereDetails ne sont pas mockees (deja testees unitairement).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const getMatiereDetails = vi.fn()
vi.mock('@/services/lms', () => ({
  default: {
    getMatiereDetails: (...a) => getMatiereDetails(...a),
    hideSeance: vi.fn().mockResolvedValue({ success: true })
  }
}))
vi.mock('@/services/lesson', () => ({
  default: {
    createLesson: vi.fn(),
    deleteLesson: vi.fn(),
    publishLesson: vi.fn(),
    unpublishLesson: vi.fn()
  }
}))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 1, role: 'enseignant' }) } }))

import { useMatiereDetails } from '@/composables/useMatiereDetails'

const SAMPLE = {
  success: true,
  data: {
    matiere: { id: 1, nom: 'Mathématiques' },
    lessons: [{ id: 10, title: 'Leçon 1' }],
    seances_programmees: [],
    evaluations_programmees: [],
    classes_concernees: [],
    statistiques: { nombre_lessons: 1 }
  }
}

async function setup(routeId = '1') {
  const push = vi.fn(); const back = vi.fn()
  let api
  const Comp = defineComponent({ setup() { api = useMatiereDetails(); return () => null } })
  mount(Comp, { global: { mocks: { $route: { params: { id: routeId } }, $router: { push, back } } } })
  await flushPromises()
  return { api, push }
}

describe('useMatiereDetails (#H9)', () => {
  it('charge le detail au montage avec id de route', async () => {
    getMatiereDetails.mockResolvedValue(SAMPLE)
    const { api } = await setup('1')
    expect(getMatiereDetails).toHaveBeenCalledWith(1)
    expect(api.matiere.value.nom).toBe('Mathématiques')
    expect(api.lessons.value).toHaveLength(1)
    expect(api.isTeacher.value).toBe(true)
    expect(api.loading.value).toBe(false)
  })

  it('expose les 4 onglets avec compteurs', async () => {
    getMatiereDetails.mockResolvedValue(SAMPLE)
    const { api } = await setup('1')
    expect(api.tabs.value.map(t => t.id)).toEqual(['lessons', 'seances', 'evaluations', 'classes'])
    expect(api.tabs.value[0].count).toBe(1)
  })

  it('createLesson ouvre la modale, closeCreateLessonModal la ferme', async () => {
    getMatiereDetails.mockResolvedValue(SAMPLE)
    const { api } = await setup('1')
    api.createLesson()
    expect(api.showCreateLessonModal.value).toBe(true)
    api.closeCreateLessonModal()
    expect(api.showCreateLessonModal.value).toBe(false)
  })

  it('viewLesson et viewClasse pilotent le router', async () => {
    getMatiereDetails.mockResolvedValue(SAMPLE)
    const { api, push } = await setup('1')
    api.viewLesson(10)
    expect(push).toHaveBeenCalledWith({ name: 'LessonView', params: { id: 10 } })
    api.viewClasse(7)
    expect(push).toHaveBeenCalledWith({ name: 'classe-details', params: { id: 7 } })
  })

  it('sur reponse en echec, renseigne error', async () => {
    getMatiereDetails.mockResolvedValue({ success: false, message: 'KO' })
    const { api } = await setup('1')
    expect(api.error.value).toBe('KO')
  })
})
