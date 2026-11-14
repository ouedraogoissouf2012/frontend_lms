/**
 * Tableau de bord de l'élève, lecture honnête (demande de la superviseure, E2E de la nuit) :
 * (1) `taux_presence` null s'affichait « 0 % » (`|| '0'`) : une absence de mesure se lit « — » ;
 * (2) le refus `enrolment_not_active` (motif EXISTANT, StudentEnrolmentService:161) est un état CLAIR,
 *     « Inscription inactive », par le catalogue, et non « Erreur de chargement » ; la donnée en cache
 *     (une ancienne classe) n'est plus montrée sous ce refus ;
 * (3) une classe nulle avec des listes vides (élève sans inscription) : un tableau vide honnête.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const h = vi.hoisted(() => ({ getStudentDashboard: vi.fn(), cache: null }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 1, name: 'Awa', role: 'etudiant' }) } }))
vi.mock('@/services/klassci', () => ({ klassciService: { getStudentDashboard: (...a) => h.getStudentDashboard(...a) } }))
vi.mock('@/services/cache', () => ({
  readCacheStale: () => ({ data: h.cache, fresh: false }),
  writeCache: () => {},
}))

import DashboardWidgets from '@/components/student/DashboardWidgets.vue'
import { useCachedResource } from '@/composables/useCachedResource'
import { useStudentDashboard } from '@/composables/useStudentDashboard'

const refusInactif = { response: { status: 403, data: { success: false, message: 'texte serveur', reason: 'enrolment_not_active' } }, userMessage: ERROR_MESSAGES.enrolmentNotActive }
const SANS_CLASSE = { classe: null, statistiques: { moyenne_generale: null, taux_presence: null }, cours: [], quiz: [], notes: [] }

async function monter(fabrique) {
  let api
  mount(defineComponent({ setup() { api = fabrique(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => { vi.clearAllMocks(); h.cache = null })

describe('DashboardWidgets — une absence de mesure n’est pas 0 %', () => {
  const taux = (statistiques) => mount(DashboardWidgets, { props: { dashboardData: { classe: { name: '6e A' }, statistiques, cours: [], quiz: [] } } })
    .findAll('.stat-value')[1].text()

  it('1. taux_presence null → « — » ; un vrai 0 reste « 0% » ; 87 → « 87% »', () => {
    expect(taux({ taux_presence: null })).toBe('—')
    expect(taux({})).toBe('—')
    expect(taux({ taux_presence: 0 })).toBe('0%')
    expect(taux({ taux_presence: 87 })).toBe('87%')
  })

  it('2. élève sans inscription : aucune classe, taux « — », listes vides comptées 0 (mesure réelle)', () => {
    const w = mount(DashboardWidgets, { props: { dashboardData: SANS_CLASSE } })
    expect(w.text()).toContain('Aucune classe assignée')
    const valeurs = w.findAll('.stat-value').map((v) => v.text())
    expect(valeurs[1]).toBe('—')
    expect(valeurs.slice(2)).toEqual(['0', '0'])
    expect(w.text()).not.toContain('0%')
  })
})

describe('useCachedResource — le motif du refus est exposé', () => {
  it('3. motif = le `reason` du refus ; remis à null sur un succès', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(refusInactif).mockResolvedValueOnce({ ok: true })
    const r = await monter(() => useCachedResource('cle', fetcher))
    expect(r.motif.value).toBe('enrolment_not_active')
    await r.refresh()
    expect(r.motif.value).toBeNull()
  })
})

describe('useStudentDashboard — inscription inactive', () => {
  it('4. refus enrolment_not_active → inscriptionInactive, sans Réessayer', async () => {
    h.getStudentDashboard.mockRejectedValue(refusInactif)
    const d = await monter(useStudentDashboard)
    expect(d.inscriptionInactive.value).toBe(true)
    expect(d.canRetry.value).toBe(false)
  })

  it('5. un autre refus n’est pas une inscription inactive', async () => {
    h.getStudentDashboard.mockRejectedValue({ response: { status: 500, data: {} }, userMessage: ERROR_MESSAGES.server })
    const d = await monter(useStudentDashboard)
    expect(d.inscriptionInactive.value).toBe(false)
  })
})

describe('StudentDashboard — l’état clair', () => {
  async function vue(refus, cache = null) {
    h.cache = cache
    h.getStudentDashboard.mockRejectedValue(refus)
    const { default: StudentDashboard } = await import('@/views/dashboards/StudentDashboard.vue')
    const w = mount(StudentDashboard, {
      global: {
        stubs: { DashboardLayout: { template: '<div><slot /></div>' }, DashboardSkeleton: true },
        directives: { reveal: {} },
      },
    })
    await flushPromises()
    return w
  }

  it('6. inscription inactive : « Inscription inactive » en role="status", le message du catalogue, ni erreur ni widgets en cache', async () => {
    const w = await vue(refusInactif, { classe: { name: 'Ancienne classe' }, statistiques: {}, cours: [], quiz: [] })
    const etat = w.find('[role="status"]')
    expect(etat.text()).toContain('Inscription inactive')
    expect(etat.text()).toContain(ERROR_MESSAGES.enrolmentNotActive)
    expect(w.text()).not.toContain('Erreur de chargement')
    expect(w.text()).not.toContain('Ancienne classe')
    expect(w.text()).not.toContain('Réessayer')
  })

  it('7. une panne reste « Erreur de chargement »', async () => {
    const w = await vue({ response: { status: 503, data: {} }, userMessage: ERROR_MESSAGES.server })
    expect(w.text()).toContain('Erreur de chargement')
    expect(w.find('[role="status"]').exists()).toBe(false)
  })
})
