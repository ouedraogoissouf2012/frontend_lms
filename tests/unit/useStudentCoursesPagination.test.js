/**
 * Pagination de « Mes cours » (#434) et course des filtres (#437).
 *
 * Le serveur pagine à 15 (`meta`) ; l'écran n'en lisait rien et l'élève ne voyait
 * que les 15 premiers cours sans le savoir. Et sans jeton de requête, la DERNIÈRE
 * réponse arrivée gagnait : un filtre lent pouvait écraser un filtre rapide choisi
 * après lui (mesuré : sélecteur « Physique », cartes « Maths »).
 *
 * Charges : capture RÉELLE `tests/fixtures/api/myCourses.js` (pages 1, 2, 3).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MY_COURSES_CAPTURES } from '../fixtures/api/myCourses'

const getMyCourses = vi.fn()
vi.mock('@/services/klassci', () => ({
  klassciService: { getMyCourses: (...args) => getMyCourses(...args) },
}))
vi.mock('@/composables/useToast', () => ({ toast: { error: vi.fn() } }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { useStudentCourses } from '@/composables/useStudentCourses'

const P1 = MY_COURSES_CAPTURES.klassci_page_1_defaut.body
const P2 = MY_COURSES_CAPTURES.klassci_page_2_defaut.body
const FILTRE = MY_COURSES_CAPTURES.klassci_filtre_matiere.body
const FILTRE_ENS = MY_COURSES_CAPTURES.klassci_filtre_enseignant.body

/** Promesse résolue À LA MAIN : c'est le test qui décide de l'ordre d'arrivée. */
function differee() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useStudentCourses(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => {
  getMyCourses.mockReset()
  getMyCourses.mockResolvedValue(P1)
})

describe('useStudentCourses — pagination (#434)', () => {
  it('lit meta : 15 cours affichés, 18 au total, une page de plus disponible', async () => {
    const c = await setup()
    expect(c.courses.value).toHaveLength(15)
    expect(c.totalCount.value).toBe(18)
    expect(c.hasMore.value).toBe(true)
  })

  it('loadMore demande la page 2 avec les mêmes filtres et AJOUTE les cours', async () => {
    const c = await setup()
    getMyCourses.mockResolvedValueOnce(P2)
    await c.loadMore()
    expect(getMyCourses).toHaveBeenLastCalledWith({}, 2)
    expect(c.courses.value).toHaveLength(18)
    expect(c.courses.value.map((x) => x.id)).toEqual([...P1.data, ...P2.data].map((x) => x.id))
    expect(c.hasMore.value).toBe(false)
  })

  it('ne demande jamais une page au-delà de last_page', async () => {
    const c = await setup()
    getMyCourses.mockResolvedValueOnce(P2)
    await c.loadMore()
    getMyCourses.mockClear()
    await c.loadMore()
    expect(getMyCourses).not.toHaveBeenCalled()
  })

  it("n'ajoute pas deux fois un cours déjà affiché (ordre non départagé, lms_backend#937)", async () => {
    const c = await setup()
    getMyCourses.mockResolvedValueOnce({ ...P2, data: [P1.data[14], ...P2.data] })
    await c.loadMore()
    const ids = c.courses.value.map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(18)
  })

  it('un échec de loadMore garde la liste et affiche son erreur à part', async () => {
    const c = await setup()
    getMyCourses.mockRejectedValueOnce(Object.assign(new Error('x'), { userMessage: 'Message du catalogue' }))
    await c.loadMore()
    expect(c.courses.value).toHaveLength(15)
    expect(c.error.value).toBe(null)
    expect(c.loadMoreError.value).toBe('Message du catalogue')
    expect(c.loadingMore.value).toBe(false)
    expect(c.hasMore.value).toBe(true)
  })

  it('un rechargement en échec ne laisse pas le compteur de l’ancienne sélection', async () => {
    const c = await setup()
    expect(c.totalCount.value).toBe(18)
    getMyCourses.mockRejectedValueOnce(Object.assign(new Error('x'), { userMessage: 'm' }))
    await c.loadCourses()
    expect(c.totalCount.value).toBe(null)
    expect(c.hasMore.value).toBe(false)
  })

  it('un changement de filtre repart de la page 1 (appel sans numéro de page)', async () => {
    const c = await setup()
    getMyCourses.mockResolvedValueOnce(P2)
    await c.loadMore()
    getMyCourses.mockResolvedValueOnce(FILTRE)
    c.selectedMatiere.value = FILTRE.filters.matieres[0].id
    c.applyFilters()
    await flushPromises()
    expect(getMyCourses).toHaveBeenLastCalledWith({ matiere_id: FILTRE.filters.matieres[0].id })
    expect(c.courses.value).toHaveLength(FILTRE.data.length)
    expect(c.totalCount.value).toBe(FILTRE.meta.total)
  })
})

describe('useStudentCourses — réponses périmées ignorées (#437)', () => {
  it('filtre lent puis retour rapide à « tous » : l’écran garde le DERNIER choisi', async () => {
    // Deux réponses aux contenus DIFFÉRENTS (6 cours d'Algorithmique, puis les 15
    // de la page 1) : avec deux réponses identiques, le test ne verrait rien.
    // (Le filtre enseignant « Fatou Diallo » rend les mêmes 6 cours que le filtre
    // « Algorithmique » dans la capture : il ne peut pas servir de témoin ici.)
    expect(FILTRE.data.map((x) => x.id)).not.toEqual(P1.data.map((x) => x.id))
    const c = await setup()
    const lent = differee()
    const rapide = differee()
    getMyCourses.mockReturnValueOnce(lent.promise).mockReturnValueOnce(rapide.promise)

    c.selectedMatiere.value = FILTRE.filters.matieres[0].id
    c.applyFilters()
    c.resetFilters()

    rapide.resolve(P1)
    await flushPromises()
    lent.resolve(FILTRE)
    await flushPromises()

    expect(c.courses.value.map((x) => x.id)).toEqual(P1.data.map((x) => x.id))
    expect(c.loading.value).toBe(false)
  })

  it('le témoin enseignant rend bien les mêmes cours que le témoin matière (raison du choix ci-dessus)', () => {
    expect(FILTRE_ENS.data.map((x) => x.id)).toEqual(FILTRE.data.map((x) => x.id))
  })

  it('l’échec d’une requête périmée n’affiche aucune erreur', async () => {
    const c = await setup()
    const lent = differee()
    getMyCourses.mockReturnValueOnce(lent.promise).mockResolvedValueOnce(FILTRE)
    c.applyFilters()
    c.applyFilters()
    await flushPromises()
    lent.reject(Object.assign(new Error('vieille'), { userMessage: 'ne doit pas paraître' }))
    await flushPromises()
    expect(c.error.value).toBe(null)
    expect(c.courses.value).toHaveLength(FILTRE.data.length)
  })

  it('Charger plus en vol puis changement de filtre : la page 2 de l’ancien filtre est ignorée', async () => {
    const c = await setup()
    const page2 = differee()
    getMyCourses.mockReturnValueOnce(page2.promise)
    const enVol = c.loadMore()
    expect(c.loadingMore.value).toBe(true)

    getMyCourses.mockResolvedValueOnce(FILTRE)
    c.selectedMatiere.value = FILTRE.filters.matieres[0].id
    c.applyFilters()
    await flushPromises()

    page2.resolve(P2)
    await enVol
    await flushPromises()

    expect(c.courses.value.map((x) => x.id)).toEqual(FILTRE.data.map((x) => x.id))
    expect(c.loadingMore.value).toBe(false)
  })

  // Revue #443 : les gardes du `finally` et du `catch` doivent être vues mordre.
  it('requête PÉRIMÉE résolue AVANT la fraîche : loading reste true jusqu’à la fraîche', async () => {
    const c = await setup()
    const ancienne = differee()
    const fraiche = differee()
    getMyCourses.mockReturnValueOnce(ancienne.promise).mockReturnValueOnce(fraiche.promise)
    c.applyFilters()
    c.resetFilters()
    ancienne.resolve(FILTRE)
    await flushPromises()
    expect(c.loading.value).toBe(true)
    expect(c.courses.value.map((x) => x.id)).not.toEqual(FILTRE.data.map((x) => x.id))
    fraiche.resolve(P1)
    await flushPromises()
    expect(c.loading.value).toBe(false)
    expect(c.courses.value.map((x) => x.id)).toEqual(P1.data.map((x) => x.id))
  })

  it('rejet PÉRIMÉ d’un loadMore : loadMoreError reste null et le loadMore frais reste en cours', async () => {
    const c = await setup()
    const vieuxPlus = differee()
    getMyCourses.mockReturnValueOnce(vieuxPlus.promise)
    const enVol = c.loadMore()
    // Le filtre change (nouvelle page 1), puis un Charger plus FRAIS part.
    getMyCourses.mockResolvedValueOnce(P1)
    c.resetFilters()
    await flushPromises()
    const fraisPlus = differee()
    getMyCourses.mockReturnValueOnce(fraisPlus.promise)
    const frais = c.loadMore()
    expect(c.loadingMore.value).toBe(true)
    vieuxPlus.reject(Object.assign(new Error('vieille'), { userMessage: 'ne doit pas paraître' }))
    await enVol
    await flushPromises()
    expect(c.loadMoreError.value).toBe(null)
    expect(c.loadingMore.value).toBe(true)
    fraisPlus.resolve(P2)
    await frais
    expect(c.loadingMore.value).toBe(false)
  })
})

