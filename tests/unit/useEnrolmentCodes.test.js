/**
 * Codes d'inscription côté personnel (#391, ADR-803-03). Émettre REMPLACE l'ancien code
 * (confirmation si un code est actif) ; retirer ferme la porte aux suivants sans
 * désinscrire personne (confirmation). Le code est affiché EN CLAIR pour être transmis,
 * mais il ne doit JAMAIS passer dans la console (journal, erreur).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const listClasses = vi.fn()
const emettre = vi.fn()
const retirer = vi.fn()
const confirmMock = vi.fn()
vi.mock('@/services/enrolmentCodes', () => ({
  enrolmentCodesService: {
    listClasses: (...a) => listClasses(...a),
    emettre: (...a) => emettre(...a),
    retirer: (...a) => retirer(...a),
  },
}))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmMock(...a) }) }))

import { useEnrolmentCodes } from '@/composables/useEnrolmentCodes'

// Forme de `GET /classes` (LMSClassesLocalesController::enVue, lms 6a62abc0).
const classe = (id, etat, valeur = null) => ({ id, libelle: `Classe ${id}`, code: `C${id}`, training_session_id: null, code_inscription: { etat, valeur } })
const CODE = 'Q7RT4K'

function erreurHttp(status) {
  const err = Object.assign(new Error(`HTTP ${status}`), { response: { status, data: { success: false, message: 'serveur' } } })
  err.userMessage = normalizeError(err).userMessage
  return err
}

async function charge(classes) {
  listClasses.mockResolvedValue({ success: true, data: classes, meta: { current_page: 1, last_page: 1 } })
  const api = useEnrolmentCodes()
  await api.load(1)
  listClasses.mockClear()
  return api
}

beforeEach(() => {
  listClasses.mockReset(); emettre.mockReset(); retirer.mockReset(); confirmMock.mockReset()
  confirmMock.mockResolvedValue(true)
})

describe('useEnrolmentCodes (#391)', () => {
  it('charge la liste paginée des classes locales', async () => {
    const api = await charge([classe(1, 'absent')])
    expect(api.classes.value).toHaveLength(1)
    expect(api.lastPage.value).toBe(1)
  })

  it('émettre un PREMIER code : sans confirmation, la ligne prend le code renvoyé', async () => {
    const api = await charge([classe(1, 'absent')])
    emettre.mockResolvedValue({ success: true, message: 'Code d\'inscription émis. Le précédent ne fonctionne plus.', data: { classe_id: 1, code_inscription: CODE } })
    expect(await api.emettre(api.classes.value[0])).toBe(true)
    expect(confirmMock).not.toHaveBeenCalled()
    expect(api.classes.value[0].code_inscription).toEqual({ etat: 'actif', valeur: CODE })
    expect(api.notice.value).toContain('émis')
  })

  it('régénérer un code ACTIF demande confirmation ; un refus n’appelle rien', async () => {
    const api = await charge([classe(1, 'actif', 'AAAAAA')])
    confirmMock.mockResolvedValue(false)
    expect(await api.emettre(api.classes.value[0])).toBe(false)
    expect(confirmMock.mock.calls[0][0].message).toContain('ne fonctionnera plus')
    expect(emettre).not.toHaveBeenCalled()
  })

  it('retirer demande confirmation ; au succès, l’état est CONNU (retiré) sans relire la liste', async () => {
    const api = await charge([classe(1, 'actif', CODE)])
    retirer.mockResolvedValue({ success: true, message: 'Code retiré. Les inscriptions déjà faites sont conservées.', data: null })
    expect(await api.retirer(api.classes.value[0])).toBe(true)
    expect(confirmMock.mock.calls[0][0].message).toContain('conservées')
    expect(listClasses).not.toHaveBeenCalled()
    expect(api.classes.value[0].code_inscription).toEqual({ etat: 'retire', valeur: null })
    expect(api.notice.value).toContain('Code retiré')
  })

  it('403 (établissement relié à KLASSCI) : message forbidden du catalogue', async () => {
    const api = await charge([classe(1, 'absent')])
    emettre.mockRejectedValue(erreurHttp(403))
    await api.emettre(api.classes.value[0])
    expect(api.error.value).toBe(ERROR_MESSAGES.forbidden)
  })

  describe('le code ne passe JAMAIS par la console', () => {
    const espions = []
    beforeEach(() => {
      for (const m of ['log', 'info', 'warn', 'error', 'debug']) espions.push(vi.spyOn(console, m).mockImplementation(() => {}))
    })
    afterEach(() => { espions.splice(0).forEach((s) => s.mockRestore()) })

    const fuite = () => espions.some((s) => s.mock.calls.some((args) => JSON.stringify(args, (k, v) => (v instanceof Error ? v.message : v)).includes(CODE)))

    it('ni à l’émission réussie', async () => {
      const api = await charge([classe(1, 'absent')])
      emettre.mockResolvedValue({ success: true, message: 'ok', data: { classe_id: 1, code_inscription: CODE } })
      await api.emettre(api.classes.value[0])
      expect(fuite()).toBe(false)
    })

    it('ni lors d’un rechargement de la liste qui le contient', async () => {
      await charge([classe(1, 'actif', CODE)])
      expect(fuite()).toBe(false)
    })
  })
})
