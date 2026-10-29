/**
 * Revue de #447 (#391, code d'inscription) : chaque test tient un constat.
 * B1/C3 vérifient le SENS des messages (le recours indiqué), pas seulement la clé.
 * C1 : un échec d'émission ou de retrait peut avoir déjà changé le code côté serveur ;
 * l'écran relit la liste, et ne dit « actualisée » que si la relecture a réussi.
 * C2 : chaque classe suit SON état occupé (deux cartes en vol), avec garde de réentrée.
 * R8 : pas deux bandeaux contradictoires. R5 : une saisie vide le dit.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const listClasses = vi.fn()
const emettre = vi.fn()
const retirer = vi.fn()
const rejoindre = vi.fn()
const confirmMock = vi.fn()
vi.mock('@/services/enrolmentCodes', () => ({
  enrolmentCodesService: {
    listClasses: (...a) => listClasses(...a),
    emettre: (...a) => emettre(...a),
    retirer: (...a) => retirer(...a),
    rejoindre: (...a) => rejoindre(...a),
  },
}))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmMock(...a) }) }))

import { useEnrolmentCodes } from '@/composables/useEnrolmentCodes'
import { useJoinClass } from '@/composables/useJoinClass'

const classe = (id, etat, valeur = null) => ({ id, libelle: `Classe ${id}`, code: `C${id}`, training_session_id: null, code_inscription: { etat, valeur } })
const liste = (classes) => ({ success: true, data: classes, meta: { current_page: 1, last_page: 1 } })
function erreurHttp(status) {
  const err = Object.assign(new Error(`HTTP ${status}`), { response: status ? { status, data: { success: false, message: 'serveur' } } : undefined })
  err.userMessage = normalizeError(err).userMessage
  return err
}
function differe() {
  let resoudre
  const promesse = new Promise((r) => { resoudre = r })
  return { promesse, resoudre }
}
async function charge(classes) {
  listClasses.mockResolvedValue(liste(classes))
  const api = useEnrolmentCodes()
  await api.load(1)
  listClasses.mockClear()
  return api
}

beforeEach(() => {
  listClasses.mockReset(); emettre.mockReset(); retirer.mockReset(); rejoindre.mockReset(); confirmMock.mockReset()
  confirmMock.mockResolvedValue(true)
})

describe('B1 / C3 : le message indique le BON recours', () => {
  it('B1 enrolment_not_active : une décision de l’établissement, pas un code périmé', () => {
    const m = ERROR_MESSAGES.enrolmentNotActive
    expect(m).toMatch(/établissement/)
    expect(m).toMatch(/inscription/i)
    expect(m).not.toMatch(/nouveau/i)
    expect(m).not.toMatch(/code/i)
  })

  it('C3 institution_cap_reached : un plafond de codes ERRONÉS, pas d’inscriptions', () => {
    const m = ERROR_MESSAGES.institutionCapReached
    expect(m).toMatch(/erroné/)
    expect(m).toMatch(/demain/)
    expect(m).not.toMatch(/limite d'inscriptions/)
  })
})

describe('C1 : un échec peut avoir déjà changé le code côté serveur', () => {
  it('émission en échec (délai) : la liste est relue, puis « actualisée » est ajouté', async () => {
    const api = await charge([classe(1, 'actif', 'ANCIEN')])
    emettre.mockRejectedValue(erreurHttp(null))
    listClasses.mockResolvedValue(liste([classe(1, 'actif', 'NOUVEAU')]))
    expect(await api.emettre(api.classes.value[0])).toBe(false)
    expect(listClasses).toHaveBeenCalledTimes(1)
    expect(api.classes.value[0].code_inscription).toEqual({ etat: 'actif', valeur: 'NOUVEAU' })
    expect(api.error.value).toBe(`${erreurHttp(null).userMessage} ${ERROR_MESSAGES.listeActualisee}`)
  })

  it('émission en échec ET relecture en échec : l’ancien code n’est plus montré, rien n’est dit « actualisé »', async () => {
    const api = await charge([classe(1, 'actif', 'ANCIEN'), classe(2, 'actif', 'AUTRE')])
    emettre.mockRejectedValue(erreurHttp(null))
    listClasses.mockRejectedValue(erreurHttp(500))
    await api.emettre(api.classes.value[0])
    expect(api.classes.value[0].code_inscription).toEqual({ etat: 'inconnu', valeur: null })
    expect(api.classes.value[1].code_inscription).toEqual({ etat: 'actif', valeur: 'AUTRE' })
    expect(api.error.value).toBe(erreurHttp(null).userMessage)
    expect(api.error.value).not.toMatch(/actualis/)
  })

  it('retrait en échec : la liste est relue aussi', async () => {
    const api = await charge([classe(1, 'actif', 'ANCIEN')])
    retirer.mockRejectedValue(erreurHttp(null))
    listClasses.mockResolvedValue(liste([classe(1, 'retire')]))
    await api.retirer(api.classes.value[0])
    expect(api.classes.value[0].code_inscription.etat).toBe('retire')
    expect(api.error.value).toContain(ERROR_MESSAGES.listeActualisee)
  })

  it.each([403, 404, 422, 429])('refus NET %i : rien n’a changé côté serveur, pas de relecture ni de « actualisée »', async (status) => {
    const api = await charge([classe(1, 'actif', 'ANCIEN')])
    emettre.mockRejectedValue(erreurHttp(status))
    await api.emettre(api.classes.value[0])
    expect(listClasses).not.toHaveBeenCalled()
    expect(api.classes.value[0].code_inscription).toEqual({ etat: 'actif', valeur: 'ANCIEN' })
    expect(api.error.value).toBe(erreurHttp(status).userMessage)
  })

  it.each([409, 503])('issue incertaine %i : relecture', async (status) => {
    const api = await charge([classe(1, 'actif', 'ANCIEN')])
    emettre.mockRejectedValue(erreurHttp(status))
    await api.emettre(api.classes.value[0])
    expect(listClasses).toHaveBeenCalledTimes(1)
  })

  it('un code d’état inconnu se régénère AVEC confirmation (il est peut-être actif)', async () => {
    const api = await charge([classe(1, 'inconnu')])
    confirmMock.mockResolvedValue(false)
    await api.emettre(api.classes.value[0])
    expect(confirmMock).toHaveBeenCalledTimes(1)
    expect(emettre).not.toHaveBeenCalled()
  })
})

describe('C2 : l’état occupé est suivi PAR classe', () => {
  it('deux cartes en vol : la fin de l’une ne libère pas l’autre', async () => {
    const api = await charge([classe(1, 'absent'), classe(2, 'absent')])
    const un = differe(), deux = differe()
    emettre.mockImplementation((id) => (id === 1 ? un.promesse : deux.promesse))
    const p1 = api.emettre(api.classes.value[0])
    const p2 = api.emettre(api.classes.value[1])
    await Promise.resolve()
    expect(api.estOccupee(1)).toBe(true)
    expect(api.estOccupee(2)).toBe(true)
    deux.resoudre({ success: true, message: 'ok', data: { code_inscription: 'BBBBBB' } })
    await p2
    expect(api.estOccupee(2)).toBe(false)
    expect(api.estOccupee(1)).toBe(true)
    un.resoudre({ success: true, message: 'ok', data: { code_inscription: 'AAAAAA' } })
    await p1
    expect(api.estOccupee(1)).toBe(false)
  })

  it('garde de réentrée : un second clic sur une classe en vol n’envoie rien', async () => {
    const api = await charge([classe(1, 'absent')])
    const un = differe()
    emettre.mockReturnValue(un.promesse)
    const p1 = api.emettre(api.classes.value[0])
    await Promise.resolve()
    expect(await api.emettre(api.classes.value[0])).toBe(false)
    expect(emettre).toHaveBeenCalledTimes(1)
    un.resoudre({ success: true, message: 'ok', data: { code_inscription: 'AAAAAA' } })
    await p1
  })
})

describe('R8 : jamais deux bandeaux contradictoires', () => {
  it('une actualisation en échec efface la notice d’un succès précédent', async () => {
    const api = await charge([classe(1, 'absent')])
    emettre.mockResolvedValue({ success: true, message: 'Code émis.', data: { code_inscription: 'AAAAAA' } })
    await api.emettre(api.classes.value[0])
    expect(api.notice.value).toBe('Code émis.')
    listClasses.mockRejectedValue(erreurHttp(500))
    await api.load()
    expect(api.error.value).not.toBe('')
    expect(api.notice.value).toBe('')
  })
})

describe('R5 : une saisie faite seulement d’espaces le dit', () => {
  it('aucun envoi, et un message qui demande le code', async () => {
    const j = useJoinClass()
    j.code.value = '   '
    expect(await j.rejoindre()).toBe(false)
    expect(rejoindre).not.toHaveBeenCalled()
    expect(j.error.value).toBe(ERROR_MESSAGES.codeVide)
    expect(j.error.value).toMatch(/code/)
  })
})
