/**
 * Test du composable useEvaluationCorrections (H2) : chargement des résultats par
 * classe, gestion d'erreur et navigation retour. evaluationService/router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ params: { id: '12' } }),
}))

const getResultsByClass = vi.fn()
vi.mock('@/services/evaluation', () => ({
  default: { getResultsByClass: (...a) => getResultsByClass(...a) },
}))

import { useEvaluationCorrections } from '@/composables/useEvaluationCorrections'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useEvaluationCorrections(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => { push.mockClear(); getResultsByClass.mockReset() })

describe('useEvaluationCorrections (H2)', () => {
  it('charge évaluation + résultats + statistiques', async () => {
    getResultsByClass.mockResolvedValue({
      success: true,
      data: {
        evaluation: { titre: 'Contrôle' },
        resultats: [{ etudiant_id: 1, note: 15, status: 'soumis' }],
        statistiques: { total_etudiants: 30, etudiants_soumis: 28, moyenne_classe: 12 },
      },
    })
    const u = await setup()
    expect(getResultsByClass).toHaveBeenCalledWith(12)
    expect(u.evaluation.value.titre).toBe('Contrôle')
    expect(u.resultats.value).toHaveLength(1)
    expect(u.statistiques.value.total_etudiants).toBe(30)
    expect(u.loading.value).toBe(false)
  })

  it('expose un message si success=false', async () => {
    getResultsByClass.mockResolvedValue({ success: false })
    const u = await setup()
    expect(u.error.value).toBe('Impossible de charger les résultats')
  })

  it('gère l\'exception (message backend)', async () => {
    getResultsByClass.mockRejectedValue({ response: { data: { message: 'KO' } } })
    const u = await setup()
    expect(u.error.value).toBe('KO')
    expect(u.loading.value).toBe(false)
  })

  it('goBack navigue vers TeacherEvaluations', async () => {
    getResultsByClass.mockResolvedValue({ success: true, data: { evaluation: {}, resultats: [], statistiques: {} } })
    const u = await setup()
    u.goBack()
    expect(push).toHaveBeenCalledWith({ name: 'TeacherEvaluations' })
  })
})
