/**
 * Test du composable useAdminDashboard (#H3 ≤300) : orchestration du tableau de
 * bord admin. Vérifie le chargement KLASSCI (stats dérivées + cache), les analytics,
 * le mapping calendrier, les helpers de rôle/titre et la navigation. Services auth,
 * klassci, analytics, cache et vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPush = vi.hoisted(() => vi.fn())
const mockAuth = vi.hoisted(() => ({ getUser: vi.fn(), getMeta: vi.fn() }))
const mockKlassci = vi.hoisted(() => ({
  getClasses: vi.fn(),
  getMatieres: vi.fn(),
  getEnseignants: vi.fn(),
  getUpcomingSeances: vi.fn(),
}))
const mockAnalytics = vi.hoisted(() => ({
  getActivityTrends: vi.fn(),
  getPendingTasks: vi.fn(),
  getRecentUsers: vi.fn(),
  getSystemMetrics: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('@/services/api', () => ({ auth: mockAuth }))
vi.mock('@/services/klassci', () => ({ klassciService: mockKlassci }))
vi.mock('@/services/analytics', () => ({ analyticsService: mockAnalytics }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))

import { useAdminDashboard } from '@/composables/useAdminDashboard'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminDashboard(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminDashboard (#H3)', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockAuth.getUser.mockReset()
    mockAuth.getMeta.mockReset()
    mockKlassci.getClasses.mockReset().mockResolvedValue([])
    mockKlassci.getMatieres.mockReset().mockResolvedValue([])
    mockKlassci.getEnseignants.mockReset().mockResolvedValue([])
    mockKlassci.getUpcomingSeances.mockReset().mockResolvedValue([])
    mockAnalytics.getActivityTrends.mockReset().mockResolvedValue(null)
    mockAnalytics.getPendingTasks.mockReset().mockResolvedValue(null)
    mockAnalytics.getRecentUsers.mockReset().mockResolvedValue([])
    mockAnalytics.getSystemMetrics.mockReset().mockResolvedValue(null)
    mockAuth.getUser.mockReturnValue({})
    mockAuth.getMeta.mockReturnValue(null)
  })

  it('charge utilisateur/meta et dérive les stats KLASSCI au montage', async () => {
    mockAuth.getUser.mockReturnValue({ name: 'Alice', role: 'superAdmin' })
    mockAuth.getMeta.mockReturnValue({ annee_universitaire_courante: { nom: '2025-2026' } })
    mockKlassci.getClasses.mockResolvedValue([
      { id: 1, places_occupees: 10 },
      { id: 2, places_occupees: 5 },
    ])
    mockKlassci.getMatieres.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    mockKlassci.getEnseignants.mockResolvedValue([{ id: 1 }, { id: 2 }])

    const s = await setup()

    expect(s.user.value.name).toBe('Alice')
    expect(s.meta.value.annee_universitaire_courante.nom).toBe('2025-2026')
    expect(s.stats.value.nb_enseignants).toBe(2)
    expect(s.stats.value.nb_etudiants).toBe(15)
    expect(s.stats.value.nb_classes_actives).toBe(2)
    expect(s.stats.value.nb_matieres_actives).toBe(3)
    expect(s.loading.value.stats).toBe(false)
  })

  it('charge les analytics (tendances, tâches, utilisateurs récents)', async () => {
    mockAnalytics.getActivityTrends.mockResolvedValue({ points: [1, 2] })
    mockAnalytics.getPendingTasks.mockResolvedValue({ pending_grading: { count: 4 } })
    mockAnalytics.getRecentUsers.mockResolvedValue([{ id: 1, name: 'Bob' }])

    const s = await setup()

    expect(s.activityData.value).toEqual({ points: [1, 2] })
    expect(s.pendingTasks.value.pending_grading.count).toBe(4)
    expect(s.recentUsers.value).toHaveLength(1)
    expect(s.loading.value.analytics).toBe(false)
  })

  it('mappe les séances à venir en événements de calendrier colorés', async () => {
    mockKlassci.getUpcomingSeances.mockResolvedValue([
      {
        id: 7,
        matiere: { libelle: 'Maths' },
        classe: { libelle: 'L1' },
        date_seance: '2026-07-01',
        heure_debut: '08:00',
        heure_fin: '10:00',
        visio_enabled: true,
        visio_active: true,
      },
    ])

    const s = await setup()
    await s.loadCalendarEvents()
    await flushPromises()

    expect(s.calendarEvents.value).toHaveLength(1)
    const ev = s.calendarEvents.value[0]
    expect(ev.id).toBe('seance-7')
    expect(ev.title).toBe('[VISIO EN COURS] Maths - L1')
    expect(ev.backgroundColor).toBe('#10b981')
    expect(ev.extendedProps.url).toBe('/coordinateur/seances')
  })

  it('laisse le calendrier vide si les séances à venir échouent', async () => {
    mockKlassci.getUpcomingSeances.mockRejectedValueOnce(new Error('backend down'))

    const s = await setup()
    await s.loadCalendarEvents()
    await flushPromises()

    expect(s.calendarEvents.value).toEqual([])
  })

  it('ne charge pas les séances au montage du dashboard', async () => {
    await setup()
    expect(mockKlassci.getUpcomingSeances).not.toHaveBeenCalled()
  })

  it('expose les helpers de rôle et de titre', async () => {
    mockAuth.getUser.mockReturnValue({ role: 'coordinateur' })
    const s = await setup()
    expect(s.isCoordinateur()).toBe(true)
    expect(s.isTeacher()).toBe(false)
    expect(s.isAdmin()).toBe(false)
    expect(s.getDashboardTitle()).toBe('Coordinateur')
  })

  describe('stats non fournies par le backend (défaut : figées à 0)', () => {
    it('dérive nb_filieres / nb_niveaux des CLASSES chargées', async () => {
      mockKlassci.getClasses.mockResolvedValue([
        { id: 1, filiere: { id: 7 }, niveau: { id: 1 } },
        { id: 2, filiere: { id: 7 }, niveau: { id: 2 } },
        { id: 3, filiere: { id: 9 }, niveau: { id: 2 } },
      ])

      const s = await setup()

      // Avant : lus depuis `stats.value` — l'objet en cours de remplacement —
      // donc toujours undefined → 0. Le dashboard affichait « Filières 0 »
      // alors que la page Classes en dérivait 11 des mêmes données.
      expect(s.stats.value.nb_filieres).toBe(2)
      expect(s.stats.value.nb_niveaux).toBe(2)
    })

    it('renseigne nb_evaluations depuis les métriques système', async () => {
      mockAnalytics.getSystemMetrics.mockResolvedValue({
        evaluations: { total: 42 },
      })

      const s = await setup()

      expect(s.stats.value.nb_evaluations).toBe(42)
    })

    it('distingue « non mesuré » (null) de « mesuré à zéro » (0)', async () => {
      mockAnalytics.getSystemMetrics.mockResolvedValue({ evaluations: { total: 0 } })
      const s = await setup()

      // Mesuré et réellement nul → 0.
      expect(s.stats.value.nb_evaluations).toBe(0)
      // Aucune source chargée pour les séances actives → null, jamais un 0
      // fabriqué qui se lirait comme une mesure.
      expect(s.stats.value.nb_seances_actives).toBe(null)
    })

    it('reste exploitable si les métriques système échouent', async () => {
      mockAnalytics.getSystemMetrics.mockRejectedValue(new Error('500'))
      mockKlassci.getClasses.mockResolvedValue([{ id: 1, filiere: { id: 7 } }])

      const s = await setup()

      expect(s.stats.value.nb_filieres).toBe(1) // les dérivations locales tiennent
      expect(s.stats.value.nb_evaluations).toBe(null) // non mesuré, pas 0
    })
  })

  describe('échec de chargement KLASSCI : jamais des zéros muets', () => {
    it('marque les compteurs NON MESURÉS (null) au lieu de les laisser à zéro', async () => {
      mockKlassci.getClasses.mockRejectedValue(new Error('proxy down'))

      const s = await setup()

      // L'écran affichait « Enseignants 0 / Étudiants 0 / Classes 0 / Matières 0 »
      // alors qu'aucun comptage n'avait abouti : la panne se lisait comme un fait.
      expect(s.stats.value.nb_enseignants).toBe(null)
      expect(s.stats.value.nb_etudiants).toBe(null)
      expect(s.stats.value.nb_classes_actives).toBe(null)
      expect(s.stats.value.nb_matieres_actives).toBe(null)
    })

    it('expose une erreur affichable (le tableau de bord était muet)', async () => {
      mockKlassci.getClasses.mockRejectedValue(new Error('proxy down'))

      const s = await setup()

      expect(s.loadError.value).toBeTruthy()
      expect(s.loading.value.stats).toBe(false)
    })

    it('n’affiche aucune erreur quand le chargement réussit', async () => {
      const s = await setup()
      expect(s.loadError.value).toBe(null)
    })
  })

  describe('rôles : décision déléguée à constants/roles.js (#659)', () => {
    it('n’intitule PAS « Super Administrateur » un admin d’ÉTABLISSEMENT', async () => {
      // `superAdmin` = super-admin d'école KLASSCI (intra-tenant) → rôle LMS admin.
      // Le titre le promouvait au rang de gestionnaire de plateforme.
      mockAuth.getUser.mockReturnValue({ role: 'superAdmin' })
      const s = await setup()
      expect(s.getDashboardTitle()).toBe('Administrateur')
    })

    it('intitule « Super Administrateur » le seul supradmin PLATEFORME', async () => {
      mockAuth.getUser.mockReturnValue({ role: 'supradmin' })
      const s = await setup()
      expect(s.getDashboardTitle()).toBe('Super Administrateur')
    })

    it('accorde le périmètre admin au supradmin plateforme (actions perdues avant)', async () => {
      mockAuth.getUser.mockReturnValue({ role: 'supradmin' })
      const s = await setup()
      expect(s.isAdmin()).toBe(true)
    })

    it('accorde le périmètre admin à l’admin d’établissement', async () => {
      mockAuth.getUser.mockReturnValue({ role: 'superAdmin' })
      const s = await setup()
      expect(s.isAdmin()).toBe(true)
    })

    it('reconnaît les ALIAS de rôle de roles.js (coordinator, secretaire, teacher)', async () => {
      mockAuth.getUser.mockReturnValue({ role: 'coordinator' })
      expect((await setup()).isCoordinateur()).toBe(true)

      mockAuth.getUser.mockReturnValue({ role: 'secretaire' })
      expect((await setup()).isCoordinateur()).toBe(true)

      mockAuth.getUser.mockReturnValue({ role: 'teacher' })
      expect((await setup()).isTeacher()).toBe(true)
    })

    it('est fail-secure sur un rôle inconnu', async () => {
      mockAuth.getUser.mockReturnValue({ role: 'chef_cuisinier' })
      const s = await setup()
      expect(s.isAdmin()).toBe(false)
      expect(s.isCoordinateur()).toBe(false)
      expect(s.isTeacher()).toBe(false)
      expect(s.getDashboardTitle()).toBe('Administrateur') // repli neutre
    })
  })

  it('navigateTo pousse la route demandée', async () => {
    const s = await setup()
    s.navigateTo('/admin/stats')
    expect(mockPush).toHaveBeenCalledWith('/admin/stats')
  })

  it('expose les formatters de présentation', async () => {
    const s = await setup()
    expect(s.getInitials('Jean Dupont')).toBe('JD')
    expect(s.getRoleLabel('etudiant')).toBe('Étudiant')
    expect(s.getRoleClass('coordinateur')).toBe('role-coordinator')
  })
})
