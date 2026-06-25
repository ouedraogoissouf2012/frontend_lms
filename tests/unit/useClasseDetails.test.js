/**
 * Test du composable useClasseDetails (#H9). Services LMS/KLASSCI mockes, route
 * injectee via global.mocks (la vue reste pilotee par $route/$router).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const getClasseDetails = vi.fn()
vi.mock('@/services/lms', () => ({
  default: {
    getClasseDetails: (...a) => getClasseDetails(...a),
    getClasseEtudiants: vi.fn().mockResolvedValue({ success: true, data: { etudiants: [{ id: 1 }] } }),
    getUpcomingSeances: vi.fn().mockResolvedValue({ success: true, data: { seances: [] } })
  }
}))
vi.mock('@/services/klassci', () => ({
  default: { getMatieres: vi.fn().mockResolvedValue([{ id: 7 }, { id: 8 }]) }
}))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: 'enseignant' }) } }))

import { useClasseDetails } from '@/composables/useClasseDetails'

async function setup(routeId = '5') {
  const push = vi.fn(); const back = vi.fn()
  let api
  const Comp = defineComponent({ setup() { api = useClasseDetails(); return () => null } })
  mount(Comp, { global: { mocks: { $route: { params: { id: routeId } }, $router: { push, back } } } })
  await flushPromises()
  return { api, push, back }
}

describe('useClasseDetails (#H9)', () => {
  it('charge la classe au montage avec id de route, puis matieres + etudiants', async () => {
    getClasseDetails.mockResolvedValue({ success: true, data: { classe: { nom: '6e A' }, evaluations_programmees: [{ id: 1 }] } })
    const { api } = await setup('5')
    expect(getClasseDetails).toHaveBeenCalledWith(5)
    expect(api.classeId.value).toBe(5)
    expect(api.classe.value).toEqual({ nom: '6e A' })
    expect(api.matieres.value).toHaveLength(2)
    expect(api.etudiants.value).toHaveLength(1)
    expect(api.loading.value).toBe(false)
  })

  it('expose les 4 onglets avec compteurs', async () => {
    getClasseDetails.mockResolvedValue({ success: true, data: { classe: {}, evaluations_programmees: [{ id: 1 }, { id: 2 }] } })
    const { api } = await setup('5')
    const ids = api.tabs.value.map(t => t.id)
    expect(ids).toEqual(['matieres', 'etudiants', 'evaluations', 'planning'])
    expect(api.tabs.value[2].count).toBe(2)
  })

  it('sur reponse en echec, renseigne error', async () => {
    getClasseDetails.mockResolvedValue({ success: false, message: 'vide' })
    const { api } = await setup('5')
    expect(api.error.value).toBe('vide')
  })

  it('viewMatiere / viewEvaluation / goBack pilotent le router', async () => {
    getClasseDetails.mockResolvedValue({ success: false })
    const { api, push, back } = await setup('5')
    api.viewMatiere(42)
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 42 } })
    api.viewEvaluation(99)
    expect(push).toHaveBeenCalledWith({ name: 'evaluation-details', params: { id: 99 } })
    api.goBack()
    expect(back).toHaveBeenCalled()
  })
})
