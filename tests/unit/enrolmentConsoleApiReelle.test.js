/**
 * Revue de #447, C4 : le code d'inscription ne passe JAMAIS par la console, côté ÉLÈVE,
 * à travers le VRAI client HTTP (api.js et son intercepteur, qui journalise chaque
 * erreur via logError). Seul l'adaptateur réseau d'axios est remplacé ; le reste de la
 * chaîne (intercepteurs, normalisation, composable) est le code livré.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useJoinClass } from '@/composables/useJoinClass'

const CODE = 'Q7RT4K'
const espions = []
let adaptateurOrigine

function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    const response = { status, statusText: '', data, headers: {}, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}
const fuite = () => espions.some((s) => s.mock.calls.some((args) => JSON.stringify(args, (k, v) => (v instanceof Error ? `${v.message} ${v.stack}` : v)).includes(CODE)))

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  for (const m of ['log', 'info', 'warn', 'error', 'debug']) espions.push(vi.spyOn(console, m).mockImplementation(() => {}))
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  espions.splice(0).forEach((s) => s.mockRestore())
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
    expect(console.warn).toHaveBeenCalled()
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
