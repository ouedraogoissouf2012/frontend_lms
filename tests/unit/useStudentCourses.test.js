/**
 * Test du composable useStudentCourses (#G1 ≤300) : chargement des cours au
 * montage, filtres disponibles, reset, navigation, et messages d'erreur (#436).
 * Services KLASSCI + toast + vue-router mockés.
 *
 * Les réponses viennent de la capture RÉELLE `tests/fixtures/api/myCourses.js`
 * (ids entiers, `success`, `meta`) — plus de charge écrite de mémoire (#436).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MY_COURSES_CAPTURES } from '../fixtures/api/myCourses'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const getMyCourses = vi.fn()
const push = vi.fn()
const toastError = vi.fn()

vi.mock('@/services/klassci', () => ({
  klassciService: { getMyCourses: (...args) => getMyCourses(...args) },
}))
vi.mock('@/composables/useToast', () => ({
  toast: { error: (...args) => toastError(...args) },
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

import { useStudentCourses } from '@/composables/useStudentCourses'

const PAGE_1 = MY_COURSES_CAPTURES.klassci_page_1_defaut.body
const FILTRE_MATIERE = MY_COURSES_CAPTURES.klassci_filtre_matiere.body
const ALGO_ID = FILTRE_MATIERE.filters.matieres[0].id

/**
 * Erreur telle que l'intercepteur de `api.js` la rejette : statut HTTP + le
 * `userMessage` que pose le VRAI `normalizeError` (pas une chaîne inventée).
 */
function erreurHttp(status) {
  const err = Object.assign(new Error(`HTTP ${status}`), { response: { status, data: {} } })
  err.userMessage = normalizeError(err).userMessage
  return err
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
  push.mockReset()
  toastError.mockReset()
  getMyCourses.mockResolvedValue(PAGE_1)
})

describe('useStudentCourses (#G1)', () => {
  it('charge les cours et les filtres disponibles au montage', async () => {
    const c = await setup()
    expect(getMyCourses).toHaveBeenCalledWith({})
    expect(c.courses.value).toHaveLength(PAGE_1.data.length)
    expect(c.courses.value[0].title).toBe(PAGE_1.data[0].title)
    expect(c.availableFilters.value.matieres).toHaveLength(2)
    expect(c.availableFilters.value.enseignants).toHaveLength(2)
    expect(c.loading.value).toBe(false)
    expect(c.error.value).toBe(null)
  })

  it('applyFilters envoie les filtres actifs et ne réécrit pas availableFilters', async () => {
    const c = await setup()
    // Piège mesuré : la réponse filtrée ne porte plus que la matière filtrée.
    getMyCourses.mockResolvedValueOnce(FILTRE_MATIERE)
    c.selectedMatiere.value = ALGO_ID
    c.applyFilters()
    await flushPromises()
    expect(getMyCourses).toHaveBeenLastCalledWith({ matiere_id: ALGO_ID })
    // availableFilters conservés : le menu garde ses deux matières.
    expect(c.availableFilters.value.matieres).toHaveLength(2)
  })

  it('resetFilters réinitialise les selects et recharge', async () => {
    const c = await setup()
    c.selectedMatiere.value = ALGO_ID
    c.selectedEnseignant.value = PAGE_1.filters.enseignants[0].id
    c.resetFilters()
    await flushPromises()
    expect(c.selectedMatiere.value).toBe('')
    expect(c.selectedEnseignant.value).toBe('')
    expect(getMyCourses).toHaveBeenLastCalledWith({})
  })

  it('navigateToCourse pousse la route lesson-details', async () => {
    const c = await setup()
    c.navigateToCourse(PAGE_1.data[0])
    expect(push).toHaveBeenCalledWith({ name: 'lesson-details', params: { id: PAGE_1.data[0].id } })
  })

  it('navigateToCourse sans id appelle toast.error', async () => {
    const c = await setup()
    c.navigateToCourse({})
    expect(push).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('Impossible de naviguer vers ce cours')
  })
})

// #436 : chaque cause a son message, celui du catalogue que l'intercepteur prépare.
describe('useStudentCourses — messages d\'erreur (#436)', () => {
  it.each([
    [403, ERROR_MESSAGES.forbidden],
    [429, ERROR_MESSAGES.rateLimit],
    [500, ERROR_MESSAGES.server],
  ])('HTTP %i → message du catalogue', async (status, attendu) => {
    getMyCourses.mockRejectedValueOnce(erreurHttp(status))
    const c = await setup()
    expect(c.error.value).toBe(attendu)
    expect(c.loading.value).toBe(false)
  })

  it('panne réseau → message réseau, distinct des erreurs serveur', async () => {
    const err = Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} })
    err.userMessage = normalizeError(err).userMessage
    getMyCourses.mockRejectedValueOnce(err)
    const c = await setup()
    expect(c.error.value).toBe(ERROR_MESSAGES.network)
  })

  it('les quatre causes donnent quatre messages différents', async () => {
    const messages = new Set()
    for (const err of [erreurHttp(403), erreurHttp(429), erreurHttp(500)]) {
      getMyCourses.mockRejectedValueOnce(err)
      messages.add((await setup()).error.value)
    }
    const reseau = Object.assign(new Error('Network Error'), { isAxiosError: true, request: {} })
    reseau.userMessage = normalizeError(reseau).userMessage
    getMyCourses.mockRejectedValueOnce(reseau)
    messages.add((await setup()).error.value)
    expect(messages.size).toBe(4)
  })

  it('une erreur sans userMessage retombe sur le message générique du catalogue', async () => {
    getMyCourses.mockRejectedValueOnce(new Error('boom'))
    const c = await setup()
    expect(c.error.value).toBe(ERROR_MESSAGES.unknown)
    expect(c.loading.value).toBe(false)
  })

  it('une réponse rejetée laisse la liste vide SANS état « aucun cours »', async () => {
    getMyCourses.mockRejectedValueOnce(Object.assign(new Error('incomplete'), { userMessage: ERROR_MESSAGES.unknown }))
    const c = await setup()
    expect(c.courses.value).toEqual([])
    // C'est `error` non nul qui empêche la vue d'afficher l'état vide.
    expect(c.error.value).toBe(ERROR_MESSAGES.unknown)
  })
})
