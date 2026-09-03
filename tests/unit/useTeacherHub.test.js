/**
 * Test du composable useTeacherHub (#H11 ≤300) : agrégation parallèle des
 * compteurs du hub enseignant (classes, matières, leçons, séances à venir,
 * évaluations, étudiants). Services KLASSCI + LMS mockés.
 *
 * L'enjeu central de ce fichier est la DISTINCTION entre « zéro » et « pas
 * mesuré ». Un hub qui affiche « 0 classe » quand le réseau est tombé annonce
 * à l'enseignant qu'il n'enseigne nulle part — un fait faux, indiscernable du
 * vrai. Les compteurs non mesurés valent `null` et l'échec est signalé.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassci, lms, lessons, cache } = vi.hoisted(() => ({
  klassci: {
    getClasses: vi.fn(),
    getMatieres: vi.fn(),
    getTeacherDashboard: vi.fn(),
    getClasseEtudiants: vi.fn(),
  },
  lms: { getMyTeachingSeances: vi.fn() },
  lessons: { getLessons: vi.fn() },
  cache: { readCacheStale: vi.fn(), writeCache: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ klassciService: klassci }))
vi.mock('@/services/lms', () => ({ lmsService: lms }))
vi.mock('@/services/lesson', () => ({ default: lessons, lessonService: lessons }))
// useCachedResource lit `readCacheStale` : `{ data: null }` = cache vide.
vi.mock('@/services/cache', () => ({
  readCache: vi.fn(() => null),
  readCacheStale: (...a) => cache.readCacheStale(...a),
  writeCache: (...a) => cache.writeCache(...a),
}))

import { useTeacherHub } from '@/composables/useTeacherHub'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherHub(); return () => null } })
  mount(Comp)
  await flushPromises()
  await flushPromises()
  return api
}

describe('useTeacherHub (#H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cache.readCacheStale.mockReturnValue({ data: null })
    klassci.getClasses.mockResolvedValue([])
    klassci.getMatieres.mockResolvedValue([])
    klassci.getTeacherDashboard.mockResolvedValue({
      classes: [{ id: 1, places_occupees: 3 }, { id: 2, nb_etudiants: 3 }],
      matieres: [{ id: 10 }, { id: 11 }, { id: 12 }],
      nb_lecons: 7,
      nb_evaluations: 4
    })
    klassci.getClasseEtudiants.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    lms.getMyTeachingSeances.mockResolvedValue({ data: [] })
    lessons.getLessons.mockResolvedValue({ data: [] })
  })

  it('compte classes, matières, leçons et évaluations depuis les services', async () => {
    const h = await setup()
    expect(h.stats.value.classes).toBe(2)
    expect(h.stats.value.matieres).toBe(3)
    expect(h.stats.value.lecons).toBe(7)
    expect(h.stats.value.evaluations).toBe(4)
    expect(h.loading.value).toBe(false)
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
  })

  it('ignore un total dashboard vide et retombe sur les compteurs classes', async () => {
    klassci.getTeacherDashboard.mockResolvedValue({
      classes: [{ id: 1, nb_etudiants: 8 }],
      matieres: [{ id: 10 }],
      statistiques: { total_etudiants: null }
    })
    const h = await setup()
    expect(h.stats.value.etudiants).toBe(8)
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

  describe('panne : ne jamais fabriquer un compteur', () => {
    function toutEchoue() {
      klassci.getTeacherDashboard.mockRejectedValue(new Error('reseau'))
      lms.getMyTeachingSeances.mockRejectedValue(new Error('reseau'))
      lessons.getLessons.mockRejectedValue(new Error('reseau'))
      klassci.getClasses.mockRejectedValue(new Error('reseau'))
    }

    it('n affiche AUCUN 0 quand rien n a pu etre mesure', async () => {
      // Le defaut vecu a l'ecran : classes/matieres/seances tombaient a 0 —
      // « vous n'enseignez a aucune classe » — alors qu'aucune reponse n'etait
      // arrivee. Le dashboard absent devenait un objet vide, et `[].length`
      // fournissait un 0 qui avait l'apparence d'une mesure.
      toutEchoue()
      const h = await setup()

      expect(h.stats.value.classes).toBeNull()
      expect(h.stats.value.matieres).toBeNull()
      expect(h.stats.value.seancesAVenir).toBeNull()
      expect(h.stats.value.lecons).toBeNull()
      expect(h.stats.value.evaluations).toBeNull()
      expect(h.stats.value.etudiants).toBeNull()
    })

    it('signale l echec au lieu de le taire', async () => {
      toutEchoue()
      const h = await setup()
      expect(h.error.value).toBeTruthy()
      expect(h.loading.value).toBe(false)
    })

    it('CONSERVE les derniers compteurs connus au lieu de les remplacer', async () => {
      // La persistance demandee : une coupure ne doit pas effacer de l'ecran
      // des chiffres deja mesures.
      cache.readCacheStale.mockReturnValue({
        data: { classes: 4, matieres: 6, lecons: 5, seancesAVenir: 0, evaluations: 27, etudiants: 13 }
      })
      toutEchoue()

      const h = await setup()

      expect(h.stats.value.classes).toBe(4)
      expect(h.stats.value.matieres).toBe(6)
      expect(h.stats.value.etudiants).toBe(13)
      expect(h.error.value).toBeTruthy()
    })

    it('ne remplace pas le cache par des compteurs non mesures', async () => {
      // Ecrire un objet de `null` ecraserait la derniere mesure valable.
      cache.readCacheStale.mockReturnValue({
        data: { classes: 4, matieres: 6, lecons: 5, seancesAVenir: 0, evaluations: 27, etudiants: 13 }
      })
      toutEchoue()

      await setup()

      expect(cache.writeCache).not.toHaveBeenCalled()
    })

    it('mesure ce qui repond meme si le reste tombe', async () => {
      // Une panne partielle ne doit pas jeter les sources qui ont repondu.
      klassci.getTeacherDashboard.mockRejectedValue(new Error('reseau'))
      klassci.getClasses.mockRejectedValue(new Error('reseau'))
      lessons.getLessons.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] })
      lms.getMyTeachingSeances.mockResolvedValue({ data: [] })

      const h = await setup()

      expect(h.stats.value.lecons).toBe(2)
      expect(h.stats.value.seancesAVenir).toBe(0)
      expect(h.stats.value.classes).toBeNull()
    })
  })
})
