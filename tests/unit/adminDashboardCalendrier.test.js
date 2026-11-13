/**
 * Tableau de bord admin, partie (a) : le calendrier dit vrai.
 *
 * Le calendrier n'était JAMAIS chargé (chargement retiré du montage, #212, pour le
 * coût de `/lms/seances/upcoming`) : le widget affichait un calendrier vide, soit
 * « aucun événement », en permanence. Désormais il se charge À LA DEMANDE : un état
 * initial vrai (« non chargé »), un bouton, le chargement, puis les événements ou un
 * état d'erreur visible avec le message du catalogue. Toujours rien au montage.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const mockAuth = vi.hoisted(() => ({ getUser: vi.fn(() => ({})), getMeta: vi.fn(() => null) }))
const mockKlassci = vi.hoisted(() => ({
  getClasses: vi.fn(), getMatieres: vi.fn(), getEnseignants: vi.fn(), getUpcomingSeances: vi.fn(),
}))
const mockAnalytics = vi.hoisted(() => ({
  getActivityTrends: vi.fn(), getPendingTasks: vi.fn(), getRecentUsers: vi.fn(), getSystemMetrics: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/api', () => ({ auth: mockAuth }))
vi.mock('@/services/klassci', () => ({ klassciService: mockKlassci }))
vi.mock('@/services/analytics', () => ({ analyticsService: mockAnalytics }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))

import { useAdminDashboard } from '@/composables/useAdminDashboard'
import DashboardCalendarPanel from '@/components/dashboard/DashboardCalendarPanel.vue'

const panne = () => Object.assign(new Error('HTTP 503'), { isAxiosError: true, response: { status: 503, data: {} } })
const seance = { id: 7, matiere: { libelle: 'Maths' }, classe: { libelle: 'L1' }, date_seance: '2026-07-01', heure_debut: '08:00', heure_fin: '10:00' }

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useAdminDashboard(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  for (const m of [...Object.values(mockKlassci), ...Object.values(mockAnalytics)]) m.mockReset()
  mockKlassci.getClasses.mockResolvedValue([])
  mockKlassci.getMatieres.mockResolvedValue([])
  mockKlassci.getEnseignants.mockResolvedValue([])
  mockAnalytics.getSystemMetrics.mockResolvedValue(null)
  mockAnalytics.getActivityTrends.mockResolvedValue(null)
  mockAnalytics.getPendingTasks.mockResolvedValue(null)
  mockAnalytics.getRecentUsers.mockResolvedValue([])
})

describe('calendrier — chargé à la demande, jamais un vide mensonger', () => {
  it('au montage : rien n est chargé, et l état le dit', async () => {
    const s = await monter()
    expect(mockKlassci.getUpcomingSeances).not.toHaveBeenCalled()
    expect(s.calendarState.value).toBe('non-charge')
  })

  it('à la demande : les séances sont chargées et l état devient « prêt »', async () => {
    mockKlassci.getUpcomingSeances.mockResolvedValue([seance])
    const s = await monter()
    await s.loadCalendarEvents()
    expect(s.calendarState.value).toBe('pret')
    expect(s.calendarEvents.value).toHaveLength(1)
  })

  it('une panne donne un état d ERREUR visible, avec le message du catalogue', async () => {
    mockKlassci.getUpcomingSeances.mockRejectedValue(panne())
    const s = await monter()
    await s.loadCalendarEvents()
    expect(s.calendarState.value).toBe('erreur')
    expect(s.calendarError.value).toBe(ERROR_MESSAGES.server)
    expect(s.calendarEvents.value).toEqual([])
  })

  it('pendant le chargement, l état est « chargement »', async () => {
    let liberer
    mockKlassci.getUpcomingSeances.mockReturnValue(new Promise((r) => { liberer = r }))
    const s = await monter()
    const enCours = s.loadCalendarEvents()
    expect(s.calendarState.value).toBe('chargement')
    liberer([])
    await enCours
    expect(s.calendarState.value).toBe('pret')
  })
})

describe('DashboardCalendarPanel — les états à l écran', () => {
  const rendre = (props) => mount(DashboardCalendarPanel, {
    props: { events: [], message: '', ...props },
    global: { stubs: { CalendarWidget: { template: '<div class="calendrier" />' } } },
  })

  it('la région d état existe dans TOUS les états, en role="status"', () => {
    for (const etat of ['non-charge', 'chargement', 'pret', 'erreur']) {
      const region = rendre({ etat }).find('[data-test="etat-calendrier"]')
      expect(region.exists()).toBe(true)
      expect(region.attributes('role')).toBe('status')
    }
  })

  it('non chargé : le dit, et propose « Afficher le calendrier », sans calendrier vide', async () => {
    const w = rendre({ etat: 'non-charge' })
    expect(w.find('[data-test="etat-calendrier"]').text()).toBe('Calendrier non chargé.')
    expect(w.find('.calendrier').exists()).toBe(false)
    await w.find('button').trigger('click')
    expect(w.emitted('charger')).toHaveLength(1)
  })

  it('en erreur : dit le message et propose de réessayer, sans calendrier vide', async () => {
    const w = rendre({ etat: 'erreur', message: ERROR_MESSAGES.server })
    expect(w.find('[data-test="etat-calendrier"]').text()).toBe(ERROR_MESSAGES.server)
    expect(w.find('.calendrier').exists()).toBe(false)
    await w.find('button').trigger('click')
    expect(w.emitted('charger')).toHaveLength(1)
  })

  it('prêt : affiche le calendrier', () => {
    expect(rendre({ etat: 'pret' }).find('.calendrier').exists()).toBe(true)
  })
})

// Lot « Réessayer », B2 : le calendrier ne propose « Réessayer » que sur une panne passagère.
describe('calendrier du tableau de bord — Réessayer seulement sur une panne', () => {
  const refus = () => Object.assign(new Error('HTTP 403'), { isAxiosError: true, response: { status: 403, data: {} }, userMessage: 'Accès refusé.' })

  it('refus : état erreur, sans Réessayer ; panne au nouvel essai : Réessayer', async () => {
    const d = await monter()
    mockKlassci.getUpcomingSeances.mockRejectedValue(refus())
    await d.loadCalendarEvents()
    expect(d.calendarState.value).toBe('erreur')
    expect(d.calendarCanRetry.value).toBe(false)
    mockKlassci.getUpcomingSeances.mockRejectedValue(panne())
    await d.loadCalendarEvents()
    expect(d.calendarState.value).toBe('erreur')
    expect(d.calendarCanRetry.value).toBe(true)
  })

  it('le panneau : erreur et refus → le message, sans bouton ; erreur et panne → Réessayer ; non chargé → Afficher', () => {
    const rendre = (props) => mount(DashboardCalendarPanel, {
      props: { events: [], message: 'Accès refusé.', ...props },
      global: { stubs: { CalendarWidget: { template: '<div class="calendrier" />' } } },
    })
    const refuse = rendre({ etat: 'erreur', canRetry: false })
    expect(refuse.text()).toContain('Accès refusé.')
    expect(refuse.findAll('button').filter((b) => /R[ée]essayer/.test(b.text()))).toHaveLength(0)
    expect(rendre({ etat: 'erreur', canRetry: true }).find('button').text()).toMatch(/R[ée]essayer/)
    expect(rendre({ etat: 'non-charge', canRetry: false }).find('button').text()).toMatch(/Afficher le calendrier/)
  })
})

// Lecture honnête (spec 3d à 25728cf8 ; défaut déjà présent pour la date nulle) : une séance sans date
// valide est écartée au lieu de jeter une RangeError qui mettait TOUT le calendrier en erreur ; aucune
// heure inventée (« 08:00 », « 10:00 ») ; date_debut / date_fin ISO lus d'abord ; fin estimée signalée.
describe('calendrier du tableau de bord — dates honnêtes', () => {
  it('une séance sans date est écartée, les autres restent ; plus d’erreur de calendrier', async () => {
    const d = await monter()
    mockKlassci.getUpcomingSeances.mockResolvedValue([{ id: 1, matiere: { nom: 'Sans date' } }, seance])
    await d.loadCalendarEvents()
    expect(d.calendarState.value).toBe('pret')
    expect(d.calendarEvents.value.map((e) => e.extendedProps.seanceId)).toEqual([7])
  })

  it('aucune heure inventée : sans heure de fin, pas de fin ; la fin estimée est signalée', async () => {
    const d = await monter()
    mockKlassci.getUpcomingSeances.mockResolvedValue([
      { id: 2, matiere: { nom: 'A' }, date_seance: '2026-07-02', heure_debut: '09:00' },
      { id: 3, matiere: { nom: 'B' }, date_debut: '2026-07-03T08:00:00+00:00', date_fin: '2026-07-03T10:00:00+00:00', heure_fin_estimee: true },
    ])
    await d.loadCalendarEvents()
    const [a, b] = d.calendarEvents.value
    expect(a.end).toBeUndefined()
    expect(new Date(a.start).getHours()).toBe(9)
    expect(b.start).toBe(new Date('2026-07-03T08:00:00+00:00').toISOString())
    expect(b.extendedProps.heureFinEstimee).toBe(true)
  })
})

