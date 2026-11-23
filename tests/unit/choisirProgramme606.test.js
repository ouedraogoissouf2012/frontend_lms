/**
 * #606, 2ᵉ PR (la 1ʳᵉ est #607) : le programme d'une session se CHOISIT dans la liste de ses programmes, et non plus
 * par son numéro. Contrat (lms_backend#1206, déployé) : `GET /programs`, `ProgramView { id, titre, version }`, paginé
 * (per_page ≤ 100), trié par titre ; la session porte `program: { id, titre }`.
 *   - toutes les pages sont lues par 100, avec une borne DÉCLARÉE ;
 *   - un échec de lecture DÉSACTIVE la création de session, sans champ numérique de repli ;
 *   - le programme qu'on vient de créer est relu et choisi ;
 *   - chaque carte dit « Formation : <titre> ».
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const get = vi.fn()
const post = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a), post: (...a) => post(...a) } }))

import { trainingSessionsService } from '@/services/trainingSessions'
import { PROGRAMMES_PAGES_MAX, useAdminTrainingSessions } from '@/composables/useAdminTrainingSessions'
import TrainingPeriodCard from '@/components/admin/TrainingPeriodCard.vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const page = (data, current = 1, last = 1) => ({ success: true, data, meta: { current_page: current, last_page: last } })
const P = (id, titre, version = 1) => ({ id, titre, version })

describe('#606 — le service lit les programmes par pages de 100', () => {
  beforeEach(() => get.mockReset())

  it('listPrograms(page) → GET /programs { page, per_page: 100 }', async () => {
    get.mockResolvedValue(page([]))
    await trainingSessionsService.listPrograms(2)
    expect(get).toHaveBeenCalledWith('/programs', { params: { page: 2, per_page: 100 } })
  })
})

describe('#606 — le composable charge TOUS les programmes', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('deux pages : les deux sont lues, dans l’ordre du serveur', async () => {
    get.mockImplementation((url, { params }) => Promise.resolve(params.page === 1 ? page([P(1, 'Alpha')], 1, 2) : page([P(2, 'Beta')], 2, 2)))
    const api = useAdminTrainingSessions()
    expect(await api.chargerProgrammes()).toBe(true)
    expect(api.programmes.value.map((p) => p.titre)).toEqual(['Alpha', 'Beta'])
    expect(api.programmesTronques.value).toBe(false)
    expect(api.programmesErreur.value).toBe('')
  })

  it('la borne déclarée : au-delà de PROGRAMMES_PAGES_MAX pages, la lecture s’arrête et l’écran le saura', async () => {
    get.mockImplementation((url, { params }) => Promise.resolve(page([P(params.page, `T${params.page}`)], params.page, PROGRAMMES_PAGES_MAX + 5)))
    const api = useAdminTrainingSessions()
    await api.chargerProgrammes()
    expect(get).toHaveBeenCalledTimes(PROGRAMMES_PAGES_MAX)
    expect(api.programmes.value).toHaveLength(PROGRAMMES_PAGES_MAX)
    expect(api.programmesTronques.value).toBe(true)
  })

  it('un échec : le message du catalogue, AUCUN programme (jamais une liste partielle)', async () => {
    get.mockImplementation((url, { params }) => (params.page === 1 ? Promise.resolve(page([P(1, 'Alpha')], 1, 2)) : Promise.reject(Object.assign(new Error('x'), { userMessage: ERROR_MESSAGES.server }))))
    const api = useAdminTrainingSessions()
    expect(await api.chargerProgrammes()).toBe(false)
    expect(api.programmes.value).toEqual([])
    expect(api.programmesErreur.value).toBe(ERROR_MESSAGES.server)
  })

  it('après « Créer le programme », la liste est relue et le nouveau programme est retenu', async () => {
    post.mockResolvedValue({ success: true, data: { id: 12, titre: 'OHADA', version: 1 } })
    get.mockResolvedValue(page([P(12, 'OHADA')]))
    const api = useAdminTrainingSessions()
    expect(await api.creerProgramme('OHADA', '')).toBe(true)
    expect(api.dernierProgrammeId.value).toBe(12)
    expect(get).toHaveBeenCalledWith('/programs', { params: { page: 1, per_page: 100 } })
    expect(api.programmes.value.map((p) => p.id)).toEqual([12])
  })
})

describe('#606 — la carte dit sa formation', () => {
  const periode = (extra = {}) => ({ id: 4, libelle: 'Promo fictive', status: 'brouillon', phase: 'a_venir', program_id: 12, program: { id: 12, titre: 'OHADA' }, starts_on: '2026-11-02', ends_on: null, ...extra })

  it('« Formation : OHADA », lu dans program.titre ; plus de numéro', () => {
    const w = mount(TrainingPeriodCard, { props: { periode: periode() } })
    expect(w.find('.period-programme').text()).toBe('Formation : OHADA')
    expect(w.text()).not.toMatch(/Programme n°/)
  })

  it('sans titre lisible : « — », jamais un numéro ni un titre inventé', () => {
    const w = mount(TrainingPeriodCard, { props: { periode: periode({ program: null }) } })
    expect(w.find('.period-programme').text()).toBe('Formation : —')
  })
})
