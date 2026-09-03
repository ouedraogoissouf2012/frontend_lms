/**
 * Test du composable useTeacherHub (#H11 ≤300) : agrégation parallèle des
 * compteurs du hub enseignant (classes, matières, leçons, séances à venir,
 * évaluations, étudiants). Services KLASSCI + LMS mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassci, lms, lesson } = vi.hoisted(() => ({
  klassci: {
    getClasses: vi.fn(),
    getMatieres: vi.fn(),
    getTeacherDashboard: vi.fn(),
    getClasseEtudiants: vi.fn(),
  },
  lms: { getMyTeachingSeances: vi.fn() },
  lesson: { getLessons: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ klassciService: klassci }))
vi.mock('@/services/lms', () => ({ lmsService: lms }))
vi.mock('@/services/lesson', () => ({ default: lesson }))

import { useTeacherHub } from '@/composables/useTeacherHub'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherHub(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherHub (#H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    klassci.getClasses.mockResolvedValue([])
    lesson.getLessons.mockResolvedValue({ success: true, data: [] })
    klassci.getMatieres.mockResolvedValue([])
    klassci.getTeacherDashboard.mockResolvedValue({
      classes: [{ id: 1, places_occupees: 3 }, { id: 2, nb_etudiants: 3 }],
      matieres: [{ id: 10 }, { id: 11 }, { id: 12 }],
      nb_lecons: 7,
      nb_evaluations: 4
    })
    klassci.getClasseEtudiants.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    lms.getMyTeachingSeances.mockResolvedValue({ data: [] })
  })

  it('compte classes, matières, leçons et évaluations depuis les services', async () => {
    const h = await setup()
    expect(h.stats.value.classes).toBe(2)
    expect(h.stats.value.matieres).toBe(3)
    expect(h.stats.value.lecons).toBe(7)
    expect(h.stats.value.evaluations).toBe(4)
    expect(h.loading.value).toBe(false)
    // La liste des classes EST desormais chargee : le dashboard ne porte pas
    // les effectifs. Un appel, pas un par classe.
    expect(klassci.getClasses).toHaveBeenCalledTimes(1)
    expect(klassci.getMatieres).not.toHaveBeenCalled()
  })

  it('totalise les étudiants sur toutes les classes', async () => {
    const h = await setup()
    expect(h.stats.value.etudiants).toBe(6)
    expect(klassci.getClasseEtudiants).not.toHaveBeenCalled()
  })

  it('prefere le total etudiants du dashboard quand il existe', async () => {
    klassci.getTeacherDashboard.mockResolvedValue({
      classes: [{ id: 1 }, { id: 2 }],
      matieres: [{ id: 10 }],
      statistiques: { total_etudiants: 42 }
    })

    const h = await setup()

    expect(h.stats.value.etudiants).toBe(42)
    expect(klassci.getClasseEtudiants).not.toHaveBeenCalled()
  })

  it('ignore un total dashboard vide et retombe sur les compteurs classes', async () => {
    klassci.getTeacherDashboard.mockResolvedValue({
      classes: [{ id: 1, nb_etudiants: 8 }],
      matieres: [{ id: 10 }],
      statistiques: { total_etudiants: null }
    })

    const h = await setup()

    expect(h.stats.value.etudiants).toBe(8)
    expect(klassci.getClasseEtudiants).not.toHaveBeenCalled()
  })

  it('ne compte que les séances à venir (date >= maintenant)', async () => {
    const futur = new Date(Date.now() + 86400000).toISOString()
    const passe = new Date(Date.now() - 86400000).toISOString()
    lms.getMyTeachingSeances.mockResolvedValue({
      data: [{ date_seance: futur }, { date_seance: passe }, { programmation: { date: futur } }],
    })
    const h = await setup()
    expect(h.stats.value.seancesAVenir).toBe(2)
  })

  it('reste robuste si un service échoue (catch → valeurs par défaut)', async () => {
    klassci.getTeacherDashboard.mockRejectedValue(new Error('boom'))
    const h = await setup()
    expect(h.stats.value.classes).toBe(0)
    // `null` et non `0` : une panne du dashboard n'est pas un effectif nul.
    // Afficher « 0 étudiant » ferait passer une absence de mesure pour un fait.
    expect(h.stats.value.etudiants).toBeNull()
    expect(h.loading.value).toBe(false)
  })

  describe('formes REELLES du payload — les cles lues n existent pas', () => {
    /**
     * Dashboard tel que KLASSCI le renvoie vraiment (mesure) :
     * { classes, enseignant, evaluations, matieres, prochaines_seances, statistiques }.
     * Ni nb_lecons, ni nb_evaluations, ni statistiques.total_etudiants.
     */
    const DASHBOARD_REEL = {
      classes: [{ id: 1, name: 'B2 COM' }, { id: 5, name: 'ROSTAN' }],
      matieres: [{ id: 1 }, { id: 2 }],
      evaluations: new Array(27).fill(0).map((_, i) => ({ id: i + 1 })),
      statistiques: {
        heures: { total_seances: 105, seances_effectuees: 1 },
        evaluations: { total_programmees: 27, a_corriger: 0 },
      },
    }

    it('compte les lecons depuis le LMS, pas depuis KLASSCI', async () => {
      // Les lecons sont une entite LMS : KLASSCI ne les connait pas. Les y
      // chercher donnait « 0 lecon » sur le hub alors que l ecran Lecons en
      // listait 5.
      klassci.getTeacherDashboard.mockResolvedValue(DASHBOARD_REEL)
      lesson.getLessons.mockResolvedValue({
        success: true,
        data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      })

      const h = await setup()

      expect(h.stats.value.lecons).toBe(5)
    })

    it('compte les evaluations la ou le dashboard les porte', async () => {
      klassci.getTeacherDashboard.mockResolvedValue(DASHBOARD_REEL)

      const h = await setup()

      // `statistiques.evaluations.total_programmees` = 27, la ou `nb_evaluations`
      // n existe pas.
      expect(h.stats.value.evaluations).toBe(27)
    })

    it('compte les etudiants depuis la liste des classes', async () => {
      klassci.getTeacherDashboard.mockResolvedValue(DASHBOARD_REEL)
      klassci.getClasses.mockResolvedValue([
        { id: 1, places_occupees: 6 },
        { id: 5, places_occupees: 0 },
      ])

      const h = await setup()

      // Le dashboard ne porte aucun effectif : sans cette source, la somme
      // valait 0 alors que l enseignant a bien des etudiants.
      expect(h.stats.value.etudiants).toBe(6)
    })

    it('n invente rien quand une source est indisponible', async () => {
      klassci.getTeacherDashboard.mockResolvedValue(DASHBOARD_REEL)
      lesson.getLessons.mockRejectedValue(new Error('503'))

      const h = await setup()

      // Une panne ne doit pas se lire « 0 lecon » : c est une absence de mesure.
      expect(h.stats.value.lecons).toBeNull()
    })
  })
})
