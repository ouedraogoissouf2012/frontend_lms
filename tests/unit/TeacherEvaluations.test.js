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

// default (composable) ET named `klassciService` (helper teacherReferentials).
vi.mock('@/services/klassci', () => ({ default: klassci, klassciService: klassci }))
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

/**
 * #420 — la mention d'accès KLASSCI est une région vivante PRÉSENTE AU MONTAGE :
 * un lecteur d'écran n'annonce que les changements d'une région qui existait déjà.
 * Elle n'est jamais masquée (ni `display:none`, ni `:empty`) ; seul son texte change.
 */
describe('TeacherEvaluations (#420) — mention d accès KLASSCI et panne', () => {
  const MENTION = "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées."
  const http = (status, data = {}, headers = {}) =>
    Object.assign(new Error(`HTTP ${status}`), {
      isAxiosError: true,
      response: { status, data: { success: false, ...data }, headers },
    })

  it('la région existe dès le montage, pendant le chargement, vide et non masquée', async () => {
    klassci.getEvaluations.mockReturnValue(new Promise(() => {}))
    const w = mount((await import('@/views/evaluations/TeacherEvaluations.vue')).default, {
      global: { stubs },
    })
    const region = w.find('[data-test="mention-source"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('role')).toBe('status')
    expect(region.text()).toBe('')
    expect(region.attributes('style')).toBeUndefined()
    expect(w.find('.content-loader').exists()).toBe(true)
    // L'état d'erreur a lui aussi sa région, présente au montage et vide.
    const alerte = w.find('[data-test="erreur-evaluations"]')
    expect(alerte.exists()).toBe(true)
    expect(alerte.attributes('role')).toBe('alert')
    expect(alerte.text()).toBe('')
    expect(alerte.attributes('style')).toBeUndefined()
  })

  it('jeton absent → la région dit la mention, sans état d erreur', async () => {
    klassci.getEvaluations.mockRejectedValue(http(401, { reason: 'klassci_token_missing', message: 'KLASSCI' }))
    const w = await mountView()
    expect(w.find('[data-test="mention-source"]').text()).toBe(MENTION)
    expect(w.find('.error-state').exists()).toBe(false)
    expect(w.find('.empty-state').exists()).toBe(true)
    expect(klassci.getTeacherDashboard).not.toHaveBeenCalled()
  })

  it('panne KLASSCI et repli en échec → état d erreur, et non une liste vide', async () => {
    const panne = http(503, { message: 'KLASSCI' }, { 'retry-after': '30' })
    klassci.getEvaluations.mockRejectedValue(panne)
    klassci.getTeacherDashboard.mockRejectedValue(panne)
    const w = await mountView()
    expect(w.find('.error-state').exists()).toBe(true)
    expect(w.find('[data-test="erreur-evaluations"] .error-message').exists()).toBe(true)
    expect(w.find('.error-message').text()).toBe(
      'Service KLASSCI temporairement indisponible. Veuillez réessayer dans quelques instants.'
    )
    expect(w.find('.empty-state').exists()).toBe(false)
  })
})
