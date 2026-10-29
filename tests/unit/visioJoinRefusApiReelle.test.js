/**
 * #429 : un refus RÉEL de join (corps d'erreur du serveur) traverse le VRAI client HTTP
 * (api.js et son intercepteur, qui pose `userMessage`), le vrai service visio, puis
 * notifyVisioError : le toast porte le message du CATALOGUE pour ce motif. Seul
 * l'adaptateur réseau d'axios et le toast sont doublés.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'

const erreur = vi.fn()
vi.mock('@/composables/useToast', () => ({ toast: { error: (...a) => erreur(...a), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }))

import api from '@/services/api'
import { lmsVisioService } from '@/services/lmsVisio'
import { useVisioStore } from '@/stores/visio'
import { notifyVisioError } from '@/services/visioFeedback'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

let adaptateurOrigine
function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    const response = { status, statusText: '', data, headers: {}, config }
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}
async function rejoindre() {
  try {
    await lmsVisioService.joinVisio(42)
  } catch (e) {
    return e
  }
  throw new Error('le join aurait dû échouer')
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  erreur.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  vi.restoreAllMocks()
})

describe('#429 — un refus réel de join s’affiche avec son motif', () => {
  it.each([
    ['not_enrolled', 'visioNotEnrolled', "Vous n'êtes pas inscrit dans cette classe"],
    ['no_classe_id', 'visioNoClasse', 'Classe non définie pour cette séance'],
  ])('403 %s → toast « %s », jamais le texte serveur', async (reason, categorie, texteServeur) => {
    repondre(403, { success: false, message: texteServeur, reason })
    const e = await rejoindre()
    expect(e.response.data.reason).toBe(reason)
    notifyVisioError(e, 'Erreur lors de la connexion à la visioconférence')
    expect(erreur).toHaveBeenCalledWith(ERROR_MESSAGES[categorie], 'Visio')
  })

  // Le serveur rend AUSSI un refus en 200 : { success: true, authorized: false, reason:
  // 'invalid_role' } (ParticipantValidationService). Sans parade, le store continuait,
  // bâtissait une salle depuis une réponse sans salle, puis « compensait » par un leave
  // d'un join qui n'avait rien écrit.
  it('200 authorized:false (invalid_role) : un REFUS, toast du catalogue, aucune salle, aucun leave', async () => {
    const appels = []
    api.defaults.adapter = async (config) => {
      appels.push(`${config.method} ${config.url}`)
      return { status: 200, statusText: '', headers: {}, config, data: { success: true, authorized: false, reason: 'invalid_role', user_role: 'parent' } }
    }
    const visio = useVisioStore()
    let e = null
    try { await visio.joinVisio(42) } catch (err) { e = err }
    expect(e).not.toBeNull()
    notifyVisioError(e, 'Erreur lors de la connexion à la visioconférence')
    expect(erreur).toHaveBeenCalledWith(ERROR_MESSAGES.visioRoleRefused, 'Visio')
    expect(appels.filter((a) => a.includes('/leave'))).toEqual([])
    expect(visio.isInVisio).toBe(false)
    expect(visio.roomConfig).toBeNull()
  })

  it('400 sans motif (visio non active) : le statut reste lisible par l’appelant', async () => {
    repondre(400, { success: false, message: "La visio n'est pas active" })
    const e = await rejoindre()
    expect(e.response.status).toBe(400)
    expect(e.response.data.reason).toBeUndefined()
  })
})
