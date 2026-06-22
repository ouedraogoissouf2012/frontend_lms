/**
 * Test de montage de la vue TeacherEvaluations (G3).
 * Le composable de données est mocké (sa logique pure est déjà couverte par
 * evaluations.test.js) ; on isole le rendu de la vue. DashboardLayout est
 * stubé en passe-plat pour exposer le contenu interne. Parité : source intacte.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}))

vi.mock('@/composables/useTeacherEvaluations', async () => {
  const { ref, reactive } = await import('vue')
  return {
    useTeacherEvaluations: () => ({
      evaluationsLMS: ref([]),
      classes: ref([]),
      matieres: ref([]),
      loading: ref(false),
      error: ref(null),
      hideExpired: ref(true),
      filters: reactive({ classe_id: '', matiere_id: '', statut: '' }),
      expiredWithoutOnlineCount: ref(0),
      filteredEvaluations: ref([]),
      stats: ref({ total: 0, enCours: 0, terminees: 0, avecVersionEnLigne: 0 }),
      loadData: vi.fn(),
      loadEvaluationsLMS: vi.fn(),
      applyFilters: vi.fn(),
      resetFilters: vi.fn()
    })
  }
})

const stubs = {
  DashboardLayout: { template: '<div><slot /></div>' },
  ContentLoader: { template: '<div class="content-loader" />' }
}

describe('TeacherEvaluations (G3) — montage', () => {
  it('monte sans erreur et affiche le titre de page', async () => {
    const w = mount((await import('@/views/evaluations/TeacherEvaluations.vue')).default, {
      global: { stubs }
    })
    await flushPromises()
    expect(w.find('.page-title').text()).toBe('Évaluations')
  })

  it('loading=false → état vide (aucune carte d’évaluation) et stats à 0', async () => {
    const w = mount((await import('@/views/evaluations/TeacherEvaluations.vue')).default, {
      global: { stubs }
    })
    await flushPromises()
    expect(w.findAllComponents({ name: 'EvaluationCard' }).length).toBe(0)
    expect(w.find('.stat-value').text()).toBe('0')
  })
})
