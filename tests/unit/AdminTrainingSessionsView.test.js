/**
 * Vue AdminTrainingSessions (revue #441) : la région d'annonce existe dès le montage
 * (A4), chaque carte suit SON état occupé (A1), et le focus ne se perd pas quand le
 * bouton cliqué disparaît après la transition (A3). Le composable est doublé.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

let etat
vi.mock('@/composables/useAdminTrainingSessions', async (orig) => ({
  ...(await orig()),
  useAdminTrainingSessions: () => etat,
}))

import AdminTrainingSessions from '@/views/admin/AdminTrainingSessions.vue'

const periode = (id, status) => ({ id, libelle: `P${id}`, status, phase: 'a_venir', program_id: 1, starts_on: '2026-11-02', ends_on: null })

function double() {
  const periodes = ref([periode(4, 'brouillon'), periode(5, 'brouillon')])
  const occupees = ref(new Set())
  return {
    periodes, loading: ref(false), error: ref(''), notice: ref(''), page: ref(1), lastPage: ref(1),
    dernierProgrammeId: ref(null), saving: ref(false),
    estOccupee: (id) => occupees.value.has(id), occupees,
    load: vi.fn(), creerProgramme: vi.fn(), creerPeriode: vi.fn(),
    transitionner: vi.fn(async (p) => {
      // Le serveur répond : la période passe « publiée », le bouton « Publier » disparaît.
      periodes.value = periodes.value.map((x) => (x.id === p.id ? { ...x, status: 'publiee' } : x))
      return true
    }),
  }
}

const monter = () => mount(AdminTrainingSessions, {
  attachTo: document.body,
  global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true } },
})

beforeEach(() => {
  document.body.innerHTML = ''
  etat = double()
})

describe('AdminTrainingSessions — revue #441', () => {
  it('A4 : la région status existe dès le montage, vide', () => {
    const w = monter()
    const status = w.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.text()).toBe('')
    w.unmount()
  })

  it('A1 : seule la carte occupée a ses boutons désactivés', async () => {
    etat.occupees.value = new Set([4])
    const w = monter()
    await flushPromises()
    const [c4, c5] = w.findAll('article.period-card')
    expect(c4.findAll('button.transition-btn').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(c5.findAll('button.transition-btn').some((b) => b.attributes('disabled') === undefined)).toBe(true)
    w.unmount()
  })

  it('A3 : après la transition, le focus revient sur la carte (son premier bouton actif)', async () => {
    const w = monter()
    await flushPromises()
    const publier = w.findAll('article.period-card')[0].findAll('button.transition-btn').find((b) => b.text() === 'Publier')
    publier.element.focus()
    await publier.trigger('click')
    await flushPromises()
    const carte = w.findAll('article.period-card')[0]
    expect(carte.text()).toContain('Publiée')
    expect(carte.element.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(carte.find('button.transition-btn').element)
    w.unmount()
  })
})
