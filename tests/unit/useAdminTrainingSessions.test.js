import { describe, expect, it, vi, beforeEach } from 'vitest'

const list = vi.fn()
const createProgram = vi.fn()
const createPeriod = vi.fn()
const transition = vi.fn()
const confirmMock = vi.fn()
vi.mock('@/services/trainingSessions', () => ({
  trainingSessionsService: {
    list: (...a) => list(...a),
    createProgram: (...a) => createProgram(...a),
    createPeriod: (...a) => createPeriod(...a),
    transition: (...a) => transition(...a),
  },
}))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmMock(...a) }) }))

import { useAdminTrainingSessions, libellePhase } from '@/composables/useAdminTrainingSessions'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

describe('useAdminTrainingSessions (#391)', () => {
  beforeEach(() => {
    list.mockReset()
    createProgram.mockReset()
    createPeriod.mockReset()
  })

  it('extrait la liste paginee', async () => {
    list.mockResolvedValue({
      data: [{ id: 1, libelle: 'Promo', status: 'brouillon', phase: 'a_venir' }],
      meta: { current_page: 1, last_page: 1 },
    })
    const api = useAdminTrainingSessions()
    await api.load(1)
    expect(api.periodes.value).toHaveLength(1)
    expect(libellePhase('a_venir')).toBe('À venir')
  })

  it('retient l id du programme cree', async () => {
    createProgram.mockResolvedValue({ data: { id: 12, titre: 'OHADA', version: 1 }, message: 'Programme créé.' })
    const api = useAdminTrainingSessions()
    await api.creerProgramme('OHADA', '')
    expect(api.dernierProgrammeId.value).toBe(12)
  })
})

// #391 : piloter le cycle de vie. Le serveur reste l'autorité ; l'écran remplace la
// période par sa réponse, et recharge la liste quand l'état a changé ailleurs (409).
describe('useAdminTrainingSessions — transitions (#391)', () => {
  const BROUILLON = { id: 4, libelle: 'Promo', status: 'brouillon', phase: 'a_venir', starts_on: '2026-11-02', program_id: 1 }

  /** Erreur telle que l'intercepteur d'api.js la rejette (vrai normalizeError). */
  function erreurHttp(status) {
    const err = Object.assign(new Error(`HTTP ${status}`), { response: { status, data: { success: false, message: 'serveur' } } })
    err.userMessage = normalizeError(err).userMessage
    return err
  }

  async function chargee() {
    list.mockResolvedValue({ data: [{ ...BROUILLON }], meta: { current_page: 1, last_page: 1 } })
    const api = useAdminTrainingSessions()
    await api.load(1)
    list.mockClear()
    return api
  }

  beforeEach(() => {
    list.mockReset()
    transition.mockReset()
    confirmMock.mockReset()
    confirmMock.mockResolvedValue(true)
  })

  it('succès : la période est remplacée par la réponse du serveur, sans recharger', async () => {
    const api = await chargee()
    transition.mockResolvedValue({ success: true, message: 'Periode publiee.', data: { id: 4, libelle: 'Promo', status: 'publiee', phase: 'a_venir' } })
    expect(await api.transitionner(api.periodes.value[0], 'publier')).toBe(true)
    expect(transition).toHaveBeenCalledWith(4, 'publier')
    expect(api.periodes.value[0]).toMatchObject({ id: 4, status: 'publiee', starts_on: '2026-11-02' })
    expect(api.notice.value).toBe('Periode publiee.')
    expect(list).not.toHaveBeenCalled()
  })

  it('409 (état changé ailleurs) : message du catalogue conflict, puis liste rechargée', async () => {
    const api = await chargee()
    transition.mockRejectedValue(erreurHttp(409))
    list.mockResolvedValue({ data: [{ ...BROUILLON, status: 'annulee' }], meta: { current_page: 1, last_page: 1 } })
    expect(await api.transitionner(api.periodes.value[0], 'publier')).toBe(false)
    expect(api.error.value).toBe(ERROR_MESSAGES.conflict)
    expect(list).toHaveBeenCalledTimes(1)
    expect(api.periodes.value[0].status).toBe('annulee')
  })

  it('403 : message forbidden, sans rechargement', async () => {
    const api = await chargee()
    transition.mockRejectedValue(erreurHttp(403))
    await api.transitionner(api.periodes.value[0], 'annuler')
    expect(api.error.value).toBe(ERROR_MESSAGES.forbidden)
    expect(list).not.toHaveBeenCalled()
  })

  it.each(['annuler', 'archiver'])('%s demande une confirmation ; un refus n’appelle pas le serveur', async (action) => {
    const api = await chargee()
    confirmMock.mockResolvedValue(false)
    expect(await api.transitionner(api.periodes.value[0], action)).toBe(false)
    expect(confirmMock).toHaveBeenCalledTimes(1)
    expect(confirmMock.mock.calls[0][0].message).toContain('irréversible')
    expect(transition).not.toHaveBeenCalled()
  })

  it.each(['publier', 'cloturer'])('%s ne demande pas de confirmation', async (action) => {
    const api = await chargee()
    transition.mockResolvedValue({ success: true, message: 'ok', data: { id: 4, status: 'publiee', phase: 'a_venir' } })
    await api.transitionner(api.periodes.value[0], action)
    expect(confirmMock).not.toHaveBeenCalled()
  })
})

