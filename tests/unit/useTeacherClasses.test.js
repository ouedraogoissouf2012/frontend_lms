/**
 * Test du composable useTeacherClasses (#H9). lmsClasses + klassci + cache mockes.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, it, expect, vi } from 'vitest'

const { getClasses, getMatieres, getTeacherClasses, getClasseEtudiants } = vi.hoisted(() => ({
  getClasses: vi.fn(),
  getMatieres: vi.fn(),
  getTeacherClasses: vi.fn(),
  getClasseEtudiants: vi.fn()
}))
vi.mock('@/services/cache', () => ({
  readCache: () => null,
  readCacheStale: () => ({ data: null }),
  writeCache: () => {},
}))
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: (...a) => getClasses(...a),
    getMatieres: (...a) => getMatieres(...a),
    getClasseEtudiants: (...a) => getClasseEtudiants(...a)
  }
}))
vi.mock('@/services/lmsClasses', () => ({
  lmsClassesService: {
    getTeacherClasses: (...a) => getTeacherClasses(...a)
  }
}))

import { useTeacherClasses } from '@/composables/useTeacherClasses'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherClasses(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherClasses (#H9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTeacherClasses.mockResolvedValue([])
    getClasses.mockResolvedValue([])
    getMatieres.mockResolvedValue([])
    getClasseEtudiants.mockResolvedValue([{ id: 10 }, { id: 11 }])
  })

  it('charge et enrichit les classes au montage', async () => {
    getTeacherClasses.mockResolvedValue([
      { id: 5, name: '6e A', places_occupees: 18, places_totales: 30 }
    ])
    const api = await setup()
    expect(api.classes.value).toHaveLength(1)
    const c = api.classes.value[0]
    expect(c.places_occupees).toBe(18)
    expect(c.places_totales).toBe(30)
    expect(api.loading.value).toBe(false)
    expect(getTeacherClasses).toHaveBeenCalledTimes(1)
    expect(getMatieres).not.toHaveBeenCalled()
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })

  it('liste les classes renvoyees par le LMS local', async () => {
    getTeacherClasses.mockResolvedValue([
      { id: 5, name: '6e A', nb_etudiants: 18 },
      { id: 6, name: '6e B', nb_etudiants: 22 }
    ])

    const api = await setup()

    expect(api.classes.value).toHaveLength(2)
    expect(api.classes.value[0].id).toBe(5)
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })

  it('sur erreur, renseigne error', async () => {
    getTeacherClasses.mockRejectedValue(new Error('boom'))
    const api = await setup()
    expect(api.error.value).toBe('Impossible de charger vos classes. Veuillez réessayer.')
    expect(getMatieres).not.toHaveBeenCalled()
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })

  describe('effectifs — le tableau de bord ne les porte pas', () => {
    /** Forme réelle du dashboard : ni effectif ni capacité. */
    const CLASSES_SANS_MESURE = [
      { id: 1, name: 'B2 COM', libelle: null },
      { id: 5, name: 'ROSTAN BTS BATIMENT', libelle: null },
    ]

    /** Forme réelle de /proxy/classes : les mesures y sont. */
    const REFERENTIEL = [
      { id: 1, name: 'B2 COM', places_occupees: 6, places_totales: 30 },
      { id: 5, name: 'ROSTAN BTS BATIMENT', places_occupees: 0, places_totales: 30 },
    ]

    it('les recupere depuis la liste des classes, en UN appel', async () => {
      getTeacherClasses.mockResolvedValue(CLASSES_SANS_MESURE)
      getClasses.mockResolvedValue(REFERENTIEL)

      const api = await setup()

      expect(api.classes.value[0].places_occupees).toBe(6)
      expect(api.classes.value[0].places_totales).toBe(30)
      // UN appel pour toutes les classes : interroger chaque classe coûterait
      // un aller-retour par carte affichée.
      expect(getClasses).toHaveBeenCalledTimes(1)
    })

    it('distingue un zero MESURE d une absence de donnee', async () => {
      getTeacherClasses.mockResolvedValue(CLASSES_SANS_MESURE)
      getClasses.mockResolvedValue(REFERENTIEL)

      const api = await setup()

      // ROSTAN compte réellement 0 inscrit : c'est un fait à afficher, pas un trou.
      expect(api.classes.value[1].places_occupees).toBe(0)
    })

    it('n invente pas d effectif si la liste des classes echoue', async () => {
      getTeacherClasses.mockResolvedValue(CLASSES_SANS_MESURE)
      getClasses.mockRejectedValue(new Error('503'))

      const api = await setup()

      // La panne d'une source ne doit ni vider l'écran ni fabriquer un chiffre.
      expect(api.classes.value).toHaveLength(2)
      expect(api.classes.value[0].places_occupees).toBeNull()
      expect(api.error.value).toBeNull()
    })
  })
})
