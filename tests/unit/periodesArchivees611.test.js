/**
 * #611 (lms_backend#1208 point 3, PR #1290, déployée) : la liste des périodes de formation écarte les ARCHIVÉES par
 * défaut ; `?archivees=1` les inclut. Le front :
 *   - envoie `archivees: 1` SEULEMENT quand « Voir les périodes archivées » est cochée (sinon, le défaut du back) ;
 *   - après un « archiver » réussi, case décochée : la ligne quitte la liste aussitôt, sans page vide trompeuse ;
 *   - case cochée : la ligne reste, avec le statut relu du serveur ;
 *   - une liste vide dit honnêtement que les archivées sont masquées.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

const get = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a), post: vi.fn() } }))

const list = vi.fn()
const transition = vi.fn()
const confirmMock = vi.fn()
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmMock(...a) }) }))

import { trainingSessionsService } from '@/services/trainingSessions'
import { useAdminTrainingSessions } from '@/composables/useAdminTrainingSessions'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const ANNULEE = { id: 4, libelle: 'Promo fictive', status: 'annulee', phase: 'a_venir', program_id: 1 }
const AUTRE = { id: 5, libelle: 'Autre fictive', status: 'brouillon', phase: 'a_venir', program_id: 1 }
const page = (data, current = 1, last = 1) => ({ success: true, data, meta: { current_page: current, last_page: last } })

describe('#611 — le service n’envoie archivees que sur demande', () => {
  beforeEach(() => {
    get.mockReset()
    get.mockResolvedValue(page([]))
  })

  it('par défaut : ni archivees ni rien d’autre que page et per_page', async () => {
    await trainingSessionsService.list(1)
    await trainingSessionsService.list(1, { archivees: false })
    expect(get.mock.calls.map((c) => c[1].params)).toEqual([{ page: 1, per_page: 25 }, { page: 1, per_page: 25 }])
  })

  it('case cochée : archivees: 1 (le back refuse toute valeur non booléenne)', async () => {
    await trainingSessionsService.list(2, { archivees: true })
    expect(get).toHaveBeenCalledWith('/training-sessions', { params: { page: 2, per_page: 25, archivees: 1 } })
  })
})

describe('#611 — le composable suit la case', () => {
  let api
  beforeEach(async () => {
    vi.spyOn(trainingSessionsService, 'list').mockImplementation((...a) => list(...a))
    vi.spyOn(trainingSessionsService, 'transition').mockImplementation((...a) => transition(...a))
    list.mockReset()
    transition.mockReset()
    confirmMock.mockReset()
    confirmMock.mockResolvedValue(true)
    list.mockResolvedValue(page([{ ...ANNULEE }, { ...AUTRE }]))
    api = useAdminTrainingSessions()
    await api.load(1)
  })

  it('la case est décochée au départ, et le chargement le dit au service', () => {
    expect(api.voirArchivees.value).toBe(false)
    expect(list).toHaveBeenLastCalledWith(1, { archivees: false })
  })

  it('cocher la case recharge la PREMIÈRE page avec les archivées', async () => {
    await api.basculerArchivees(true)
    expect(api.voirArchivees.value).toBe(true)
    expect(list).toHaveBeenLastCalledWith(1, { archivees: true })
  })

  it('archiver, case décochée : la ligne quitte la liste aussitôt, sans recharger, et l’écran dit où la revoir', async () => {
    list.mockClear()
    transition.mockResolvedValue({ success: true, data: { id: 4, status: 'archivee', phase: 'a_venir' } })
    expect(await api.transitionner(api.periodes.value[0], 'archiver')).toBe(true)
    expect(api.periodes.value.map((p) => p.id)).toEqual([5])
    expect(api.notice.value).toBe(ERROR_MESSAGES.periodeArchiveeMasquee)
    expect(list).not.toHaveBeenCalled()
  })

  it('archiver, case cochée : la ligne reste, avec le statut RELU du serveur', async () => {
    await api.basculerArchivees(true)
    transition.mockResolvedValue({ success: true, data: { id: 4, status: 'archivee', phase: 'a_venir' } })
    await api.transitionner(api.periodes.value[0], 'archiver')
    expect(api.periodes.value.find((p) => p.id === 4)).toMatchObject({ status: 'archivee' })
    expect(api.notice.value).toBe('Période mise à jour.')
  })

  it('c’est le statut RELU qui décide, pas le bouton : une réponse non archivée garde la ligne', async () => {
    transition.mockResolvedValue({ success: true, data: { id: 4, status: 'annulee', phase: 'a_venir' } })
    await api.transitionner(api.periodes.value[0], 'archiver')
    expect(api.periodes.value.map((p) => p.id)).toEqual([4, 5])
  })

  it('la DERNIÈRE ligne de la page 2 archivée : la page 1 est rechargée, jamais une page vide', async () => {
    list.mockResolvedValue(page([{ ...ANNULEE }], 2, 2))
    await api.load(2)
    list.mockReset()
    list.mockResolvedValue(page([{ ...AUTRE }], 1, 1))
    transition.mockResolvedValue({ success: true, data: { id: 4, status: 'archivee' } })
    await api.transitionner(api.periodes.value[0], 'archiver')
    expect(list).toHaveBeenCalledWith(1, { archivees: false })
    expect(api.periodes.value.map((p) => p.id)).toEqual([5])
  })

  it('la dernière ligne de la page 1, d’autres pages existant : la page 1 est relue', async () => {
    list.mockResolvedValue(page([{ ...ANNULEE }], 1, 3))
    await api.load(1)
    list.mockReset()
    list.mockResolvedValue(page([{ ...AUTRE }], 1, 2))
    transition.mockResolvedValue({ success: true, data: { id: 4, status: 'archivee' } })
    await api.transitionner(api.periodes.value[0], 'archiver')
    expect(list).toHaveBeenCalledWith(1, { archivees: false })
  })

  it('le texte du front est sans jargon et nomme la case', () => {
    expect(ERROR_MESSAGES.periodeArchiveeMasquee).toContain('« Voir les périodes archivées »')
    expect(ERROR_MESSAGES.periodesArchiveesMasquees).toContain('« Voir les périodes archivées »')
    for (const t of [ERROR_MESSAGES.periodeArchiveeMasquee, ERROR_MESSAGES.periodesArchiveesMasquees]) expect(t).not.toMatch(/archivees=|\?|null/)
  })
})
