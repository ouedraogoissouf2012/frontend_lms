/**
 * Recherche globale : jamais de résultats périmés, et une panne se dit.
 *
 * Le service avalait toute erreur (`null`) et l'écran gardait alors les résultats de
 * la requête PRÉCÉDENTE sous la nouvelle saisie — l'effet d'un 429 (`throttle:search`)
 * en pleine frappe. Une réponse lente pouvait aussi écraser une plus récente.
 * Désormais : seule la dernière requête compte, la précédente est ANNULÉE, et un
 * échec vide les résultats et affiche le message du catalogue. Une annulation n'est
 * pas un échec.
 *
 * Tout passe par le VRAI service, avec un `api` simulé qui respecte `signal`.
 */
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const getMock = vi.hoisted(() => vi.fn())
vi.mock('@/services/api', () => ({ default: { get: (...a) => getMock(...a), post: vi.fn() } }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { searchService } from '@/services/search'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

const VIDE = { users: [], lessons: [], evaluations: [], classes: [], matieres: [] }
const reponse = (lecons) => ({ success: true, query: 'x', results: { ...VIDE, lessons: lecons }, total: lecons.length, categories: {}, sources_failed: [] })
const http = (status) => Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status, data: {} } })
const annulation = () => Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' })

/** Requête différée, que le test résout à la main ; elle respecte l'annulation par `signal`. */
function differee() {
  let resoudre, rejeter
  const promesse = new Promise((ok, ko) => { resoudre = ok; rejeter = ko })
  return { promesse, resoudre, rejeter }
}

function repondreAvec(parRequete) {
  getMock.mockImplementation((_url, config = {}) => {
    const d = parRequete(config.params?.query)
    config.signal?.addEventListener('abort', () => d.rejeter(annulation()))
    return d.promesse
  })
}

function monter() {
  const isOpen = ref(false)
  let api
  mount(defineComponent({ setup() { api = useGlobalSearch({ isOpen, onResultSelected: vi.fn() }); return () => h('div') } }))
  return api
}

async function chercher(api, q) {
  api.query.value = q
  return api.performSearch()
}

beforeEach(() => {
  getMock.mockReset()
})

describe('searchService — une panne ou un refus est un ÉCHEC, jamais « aucun résultat »', () => {
  it.each([
    ['429', () => Promise.reject(http(429))],
    ['500', () => Promise.reject(http(500))],
    ['success faux', () => Promise.resolve({ success: false })],
    ['résultats absents', () => Promise.resolve({ success: true })],
  ])('globalSearch rejette (%s)', async (_nom, r) => {
    getMock.mockImplementation(r)
    await expect(searchService.globalSearch('math')).rejects.toBeInstanceOf(Error)
  })

  it('getSearchHistory rejette une panne au lieu de rendre une liste vide', async () => {
    getMock.mockRejectedValue(http(503))
    await expect(searchService.getSearchHistory()).rejects.toBeInstanceOf(Error)
  })

  it('globalSearch transmet le signal d annulation au client', async () => {
    getMock.mockResolvedValue(reponse([]))
    const controleur = new AbortController()
    await searchService.globalSearch('math', 5, { signal: controleur.signal })
    expect(getMock.mock.calls[0][1].signal).toBe(controleur.signal)
  })
})

describe('useGlobalSearch — jamais de résultats périmés', () => {
  it('A réussit puis B échoue : plus aucun résultat de A, et le message du catalogue', async () => {
    const api = monter()
    getMock.mockResolvedValueOnce(reponse([{ id: 1, title: 'A' }]))
    await chercher(api, 'math')
    expect(api.totalResults.value).toBe(1)

    getMock.mockRejectedValueOnce(http(500))
    await chercher(api, 'phys')
    expect(api.totalResults.value).toBe(0)
    expect(api.searchError.value).toBe(ERROR_MESSAGES.server)
  })

  it('un 429 dit le message de la catégorie existante', async () => {
    const api = monter()
    getMock.mockRejectedValueOnce(http(429))
    await chercher(api, 'math')
    expect(api.searchError.value).toBe(ERROR_MESSAGES.rateLimit)
  })

  it('une réponse lente d une requête ANCIENNE n écrase pas la plus récente', async () => {
    const lentes = {}
    repondreAvec((q) => (lentes[q] = differee()))
    const api = monter()
    const premiere = chercher(api, 'ma')
    const seconde = chercher(api, 'math')
    lentes.math.resoudre(reponse([{ id: 2, title: 'math' }]))
    await seconde
    lentes.ma.resoudre(reponse([{ id: 1, title: 'ma' }, { id: 9 }]))
    await premiere
    expect(api.results.value.lessons).toEqual([{ id: 2, title: 'math' }])
  })

  it('même si l annulation arrive trop tard (réponse déjà partie), la réponse ancienne est ignorée', async () => {
    // Client qui ne réagit PAS au signal : seule la règle « dernière requête » protège.
    const lentes = {}
    getMock.mockImplementation((_url, config = {}) => (lentes[config.params?.query] = differee()).promesse)
    const api = monter()
    const premiere = chercher(api, 'ma')
    const seconde = chercher(api, 'math')
    lentes.math.resoudre(reponse([{ id: 2, title: 'math' }]))
    await seconde
    lentes.ma.resoudre(reponse([{ id: 1, title: 'ma' }, { id: 9 }]))
    await premiere
    expect(api.results.value.lessons).toEqual([{ id: 2, title: 'math' }])
  })

  it('la requête précédente est ANNULÉE, et l annulation n est ni un échec ni un vidage', async () => {
    const lentes = {}
    repondreAvec((q) => (lentes[q] = differee()))
    const api = monter()
    const premiere = chercher(api, 'ma')
    const signalPremiere = getMock.mock.calls[0][1].signal
    const seconde = chercher(api, 'math')
    expect(signalPremiere.aborted).toBe(true)
    await premiere
    expect(api.searchError.value).toBe('')
    expect(api.searching.value).toBe(true)
    lentes.math.resoudre(reponse([{ id: 2 }]))
    await seconde
    expect(api.searching.value).toBe(false)
    expect(api.totalResults.value).toBe(1)
  })

  it('effacer la saisie annule la requête en vol, qui ne réécrit plus rien', async () => {
    const lentes = {}
    repondreAvec((q) => (lentes[q] = differee()))
    const api = monter()
    const enVol = chercher(api, 'math')
    api.query.value = 'm'
    api.handleInput()
    await enVol
    expect(api.totalResults.value).toBe(0)
    expect(api.searching.value).toBe(false)
    expect(api.searchError.value).toBe('')
  })

  it('l historique en panne ne bloque pas l ouverture de la recherche', async () => {
    getMock.mockRejectedValue(http(503))
    const isOpen = ref(false)
    let api
    mount(defineComponent({ setup() { api = useGlobalSearch({ isOpen, onResultSelected: vi.fn() }); return () => h('div') } }))
    isOpen.value = true
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    expect(api.searchHistory.value).toEqual([])
  })
})
