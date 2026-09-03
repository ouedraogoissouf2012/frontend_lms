/**
 * Vue TeacherEvaluations (#278) — câblage RÉEL vue ↔ composable.
 *
 * AVANT : ce test mockait `useTeacherEvaluations` (le composable-SUJET) → il ne
 * vérifiait qu'un rendu à vide qui se reflétait lui-même (faux-vert). MAINTENANT :
 * on monte avec le VRAI `useTeacherEvaluations`, alimenté par des SERVICES mockés,
 * et on vérifie que le template reflète les données réelles (une carte par
 * évaluation filtrée). Le composable d'ACTIONS, testé à part, reste un
 * collaborateur mocké — ce n'est pas le sujet ici.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassci, evaluation } = vi.hoisted(() => ({
  klassci: {
    getClasses: vi.fn(),
    getMatieres: vi.fn(),
    getEvaluations: vi.fn(),
    getTeacherDashboard: vi.fn(),
  },
  evaluation: { getEvaluations: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ default: klassci }))
vi.mock('@/services/evaluation', () => ({ default: evaluation }))
vi.mock('@/services/cache', () => ({ readCache: vi.fn(() => null), writeCache: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
// Collaborateur (actions) testé séparément → mocké, pas le sujet du câblage données.
vi.mock('@/composables/useTeacherEvaluationActions', () => ({
  useTeacherEvaluationActions: () => ({
    syncing: false, showCreateModal: false, selectedEvaluation: null, creating: false, onlineForm: {},
    createOnlineVersion: vi.fn(), closeCreateModal: vi.fn(), submitCreateOnlineVersion: vi.fn(),
    editOnlineVersion: vi.fn(), viewResults: vi.fn(), syncToKlassci: vi.fn(),
    publishEvaluation: vi.fn(), previewEvaluation: vi.fn(), deleteEvaluation: vi.fn(),
  }),
}))

const stubs = {
  DashboardLayout: { template: '<div><slot /></div>' },
  ContentLoader: { template: '<div class="content-loader" />' },
  TeacherEvalFilters: true,
  TeacherEvalStats: { props: ['stats'], template: '<div class="stat-total">{{ stats.total }}</div>' },
  EvaluationCard: { name: 'EvaluationCard', props: ['evaluation'], template: '<div class="eval-card" />' },
  TeacherEvalEmptyState: { template: '<div class="empty-state" />' },
  TeacherEvalCreateModal: true,
}

async function mountView() {
  const w = mount((await import('@/views/evaluations/TeacherEvaluations.vue')).default, {
    global: { stubs },
  })
  await flushPromises()
  return w
}

beforeEach(() => {
  vi.clearAllMocks()
  klassci.getClasses.mockResolvedValue([])
  klassci.getMatieres.mockResolvedValue([])
  klassci.getEvaluations.mockResolvedValue({ success: true, data: [] })
  evaluation.getEvaluations.mockResolvedValue({ success: true, data: [] })
})

describe('TeacherEvaluations (#278) — câblage réel vue ↔ composable', () => {
  it('rend une EvaluationCard par évaluation filtrée (données réelles du composable)', async () => {
    klassci.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    const w = await mountView()
    expect(w.findAll('.eval-card')).toHaveLength(2)
    expect(w.find('.stat-total').text()).toBe('2')
    expect(w.find('.page-title').text()).toBe('Évaluations')
  })

  it('aucune évaluation → état vide et 0 carte', async () => {
    const w = await mountView()
    expect(w.findAll('.eval-card')).toHaveLength(0)
    expect(w.find('.empty-state').exists()).toBe(true)
    expect(w.find('.stat-total').text()).toBe('0')
  })

  it('KLASSCI en échec → repli dashboard alimente quand même les cartes', async () => {
    klassci.getEvaluations.mockRejectedValue(new Error('403'))
    klassci.getTeacherDashboard.mockResolvedValue({ evaluations: [{ id: 7 }] })
    const w = await mountView()
    expect(w.findAll('.eval-card')).toHaveLength(1)
  })
})
