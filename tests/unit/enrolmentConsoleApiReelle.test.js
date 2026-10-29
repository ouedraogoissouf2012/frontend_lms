/**
 * Revue de #447, C4 : le code d'inscription ne passe JAMAIS par la console, côté ÉLÈVE,
 * à travers le VRAI client HTTP (api.js et son intercepteur, qui journalise chaque
 * erreur via logError). Seul l'adaptateur réseau d'axios est remplacé ; le reste de la
 * chaîne (intercepteurs, normalisation, composable) est le code livré.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useJoinClass } from '@/composables/useJoinClass'
import { useEnrolmentCodes } from '@/composables/useEnrolmentCodes'
import { espionnerConsole } from '../helpers/consoleFuite'

const CODE = 'Q7RT4K'
let console_
let adaptateurOrigine

function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    const response = { status, statusText: '', data, headers: {}, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}
// Détecteur partagé (tests/helpers/consoleFuite.js) : corps envoyé ET reçu d'une erreur.
const fuite = () => console_.contient(CODE)

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  console_ = espionnerConsole()
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  console_.restaurer()
})

describe('C4 — élève, vrai client HTTP : le code ne fuit pas en console', () => {
  it.each([
    [404, { success: false, message: 'Aucune classe ne correspond.' }],
    [409, { success: false, message: 'serveur', reason: 'enrolment_not_active' }],
    [429, { success: false, message: 'serveur', reason: 'account_quota_exceeded' }],
    [500, { success: false, message: 'erreur' }],
  ])('refus %i : l’intercepteur journalise, mais sans le code', async (status, corps) => {
    repondre(status, corps)
    const j = useJoinClass()
    j.code.value = CODE.toLowerCase()
    expect(await j.rejoindre()).toBe(false)
    // La journalisation a BIEN eu lieu : le test passerait à vide sinon.
    expect(console_.appelee('warn')).toBe(true)
    expect(fuite()).toBe(false)
  })

  it('N3 : le détecteur voit le code caché dans config.data d’une AxiosError', () => {
    const err = new AxiosError('x', AxiosError.ERR_BAD_REQUEST, { data: JSON.stringify({ code: CODE }) })
    console.warn('journal', err)
    expect(fuite()).toBe(true)
  })

  it('le détecteur voit un code renvoyé dans la RÉPONSE d’une erreur (celle d’émission le contient)', () => {
    const reponse = { status: 500, data: { success: false, data: { code_inscription: CODE } } }
    console.error('journal', new AxiosError('x', AxiosError.ERR_BAD_RESPONSE, {}, {}, reponse))
    expect(fuite()).toBe(true)
  })

  it.each([500, 503])('personnel, émission en échec %i dont la réponse porte le code : journalisée, sans le code', async (status) => {
    api.defaults.adapter = async (config) => {
      const response = { status, statusText: '', data: { success: false, data: { code_inscription: CODE } }, headers: {}, config }
      throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response)
    }
    const codes = useEnrolmentCodes()
    codes.classes.value = [{ id: 1, libelle: 'Classe 1', code_inscription: { etat: 'absent', valeur: null } }]
    await codes.emettre(codes.classes.value[0])
    expect(console_.appelee('warn')).toBe(true)
    expect(fuite()).toBe(false)
  })

  it('personnel, émission réussie (201, la réponse porte le code) : rien en console', async () => {
    repondre(201, { success: true, message: 'Code émis.', data: { classe_id: 1, code_inscription: CODE } })
    const codes = useEnrolmentCodes()
    codes.classes.value = [{ id: 1, libelle: 'Classe 1', code_inscription: { etat: 'absent', valeur: null } }]
    expect(await codes.emettre(codes.classes.value[0])).toBe(true)
    expect(codes.classes.value[0].code_inscription.valeur).toBe(CODE)
    expect(fuite()).toBe(false)
  })

  it('succès 201 : rien en console non plus', async () => {
    repondre(201, { success: true, message: 'Vous avez rejoint la classe.', data: { classe: { id: 9, libelle: 'Session Data' } } })
    const j = useJoinClass()
    j.code.value = CODE
    expect(await j.rejoindre()).toBe(true)
    expect(fuite()).toBe(false)
  })
})
