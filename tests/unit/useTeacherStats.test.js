/**
 * Test du composable useTeacherStats : agrégation des DEUX sources, cache SWR,
 * gestion d'erreur.
 *
 * ## Pourquoi ce fichier a été réécrit
 *
 * Sa fixture précédente inventait la charge KLASSCI :
 *
 * ```js
 * statistiques: { total_etudiants: 30, total_lecons: 8,
 *                 corrections_effectuees: 4, visio_effectuees: 2, messages_forum: 9 }
 * seances: [{ id: 1 }]
 * ```
 *
 * **KLASSCI n'envoie aucune de ces clés.** Mesuré le 2026-09-09 avec un jeton
 * enseignant réel, `me/teacher-dashboard` rend `statistiques: { heures: {...},
 * evaluations: {...} }` et `prochaines_seances`, jamais `seances`.
 *
 * Le test était donc vert sur une charge qui n'existe pas, pendant que l'écran
 * affichait six zéros en production. C'est le sixième « test vert qui ne prouve
 * rien » de ce chantier, et le seul que personne n'avait relevé.
 *
 * La fixture est désormais la réponse RÉELLE, partagée avec
 * `tests/unit/teacherStats.test.js`.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassciMock, lmsMock, cacheMock } = vi.hoisted(() => ({
  klassciMock: { getTeacherDashboard: vi.fn() },
  lmsMock: { getTeacherDashboard: vi.fn() },
  cacheMock: { readCacheStale: vi.fn(), writeCache: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ klassciService: klassciMock }))
vi.mock('@/services/api', () => ({ dashboard: lmsMock }))
// #224 : le composable passe par useCachedResource (SWR) → cache via readCacheStale.
vi.mock('@/services/cache', () => ({ readCacheStale: cacheMock.readCacheStale, writeCache: cacheMock.writeCache }))

import { useTeacherStats } from '@/composables/useTeacherStats'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherStats(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

/** Charge `data` RÉELLE de `me/teacher-dashboard`, mesurée le 2026-09-09. */
const KLASSCI_REEL = {
  matieres: [{ id: 1, nom: 'Marketing digital' }, { id: 3, nom: 'Anglais' }],
  classes: [{ id: 1, name: 'B2 COM', libelle: null, niveau: { id: 1, nom: 'BTS 1ere ANNEE', code: '1A' } }],
  prochaines_seances: [],
  evaluations: [{ id: 1 }, { id: 2 }],
  statistiques: {
    heures: { total_seances: 105, seances_effectuees: 0 },
    evaluations: { total_programmees: 27, a_corriger: 0 },
  },
}

/** Charge `data` RÉELLE de `/dashboard/teacher` (LMS). */
const LMS_REEL = {
  lessons: { total: 1, published: 0, draft: 1, top_lessons: [] },
  quizzes: { total: 0, to_grade: 0 },
  forum: { unresolved_topics: 0 },
}

describe('useTeacherStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cacheMock.readCacheStale.mockReturnValue({ data: null, fresh: false })
    klassciMock.getTeacherDashboard.mockResolvedValue(KLASSCI_REEL)
    lmsMock.getTeacherDashboard.mockResolvedValue({ success: true, data: LMS_REEL })
  })

  it('demande chaque compteur à la source qui le détient', async () => {
    const s = await setup()

    // KLASSCI : le référentiel académique.
    expect(s.stats.value.nb_matieres).toBe(2)
    expect(s.stats.value.nb_evaluations).toBe(2)
    expect(s.stats.value.nb_seances).toBe(105)

    // LMS : `lessons` est SA table ; KLASSCI ne l'a jamais eue.
    expect(s.stats.value.nb_lecons).toBe(1)

    expect(cacheMock.writeCache).toHaveBeenCalledWith('teacher_stats', expect.any(Object))
  })

  it('rend « non mesuré » plutôt qu’un zéro inventé', async () => {
    const s = await setup()

    expect(s.stats.value.nb_etudiants).toBeNull()
    expect(s.stats.value.nb_visio).toBeNull()
    expect(s.stats.value.nb_messages_forum).toBeNull()
  })

  it('un LMS indisponible n’efface PAS les compteurs KLASSCI', async () => {
    // La source locale est complémentaire : son échec ne doit pas vider l'écran.
    lmsMock.getTeacherDashboard.mockRejectedValue(new Error('LMS KO'))

    const s = await setup()

    expect(s.error.value).toBeNull()
    expect(s.stats.value.nb_matieres).toBe(2)
    expect(s.stats.value.nb_seances).toBe(105)
    expect(s.stats.value.nb_lecons).toBeNull()
  })

  it('cache PÉRIMÉ : sert le cache (SWR) puis revalide en arrière-plan (#224)', async () => {
    cacheMock.readCacheStale.mockReturnValue({ data: { nb_matieres: 99, par_matiere: [], par_classe: [] }, fresh: false })

    const s = await setup()

    expect(s.loading.value).toBe(false)
    expect(klassciMock.getTeacherDashboard).toHaveBeenCalled()
    expect(s.stats.value.nb_matieres).toBe(2)
  })

  it('expose une erreur si KLASSCI échoue', async () => {
    // L'échec de KLASSCI, lui, n'est PAS avalé : sinon l'écran serait
    // entièrement à zéro sans rien dire — le défaut qu'on corrige.
    klassciMock.getTeacherDashboard.mockRejectedValue(new Error('boom'))

    const s = await setup()

    expect(s.error.value).toBe('Impossible de charger les données.')
    expect(s.loading.value).toBe(false)
  })
})
