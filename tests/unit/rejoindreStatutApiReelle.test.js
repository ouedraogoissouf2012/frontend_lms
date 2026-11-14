/**
 * C43 (D425, D426) : « rejoint » (201) et « déjà inscrit » (200) ne se distinguent que par le
 * STATUT de POST /me/inscriptions (aucune clé du serveur). L'intercepteur rend `response.data`,
 * le statut s'y perd : le service le relève par un `transformResponse` LOCAL à cette requête.
 *
 * Ici le VRAI client HTTP (api.js, ses intercepteurs, les transformations d'axios) : seul
 * l'adaptateur réseau est remplacé. Piège mesuré : axios applique aussi `transformResponse` aux
 * réponses d'ERREUR ; un 4xx doit garder son corps intact, `reason` compris.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { useJoinClass } from '@/composables/useJoinClass'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const PIEGE = 'Texte serveur, jamais affiché'
const CLASSE = { id: 9, libelle: 'Session Data' }
let adaptateurOrigine

// Le corps arrive en TEXTE, comme du réseau : les transformations par défaut d'axios le lisent.
function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('rejoindre : le statut distingue « rejoint » et « déjà inscrit » (vrai client HTTP)', () => {
  it('201 : le service rend le corps et dejaInscrit = false', async () => {
    repondre(201, { success: true, message: PIEGE, data: { classe: CLASSE } })
    const reponse = await enrolmentCodesService.rejoindre('Q7RT4K')
    expect(reponse.dejaInscrit).toBe(false)
    expect(reponse.data.classe).toEqual(CLASSE)
  })

  it('200 : le service rend dejaInscrit = true', async () => {
    repondre(200, { success: true, message: PIEGE, data: { classe: CLASSE } })
    expect((await enrolmentCodesService.rejoindre('Q7RT4K')).dejaInscrit).toBe(true)
  })

  it.each([
    [201, 'Vous avez rejoint la classe.'],
    [200, 'Vous êtes déjà inscrit dans cette classe.'],
  ])('%i : l’écran dit le texte du front, jamais celui du serveur', async (status, attendu) => {
    repondre(status, { success: true, message: PIEGE, data: { classe: CLASSE } })
    const j = useJoinClass()
    j.code.value = 'Q7RT4K'
    expect(await j.rejoindre()).toBe(true)
    expect(j.result.value).toEqual({ classe: CLASSE, message: attendu })
  })

  it('un 4xx garde son corps intact : le reason est lu, le motif du catalogue est dit', async () => {
    const corps = { success: false, message: PIEGE, reason: 'enrolment_not_active' }
    repondre(409, corps)
    const err = await enrolmentCodesService.rejoindre('Q7RT4K').catch((e) => e)
    expect(err.response.status).toBe(409)
    expect(err.response.data).toEqual(corps)

    repondre(409, corps)
    const j = useJoinClass()
    j.code.value = 'Q7RT4K'
    expect(await j.rejoindre()).toBe(false)
    expect(j.error.value).toBe(ERROR_MESSAGES.enrolmentNotActive)
  })

  it('un 404 garde son corps intact (reason lu), et dit « code inconnu »', async () => {
    const corps = { success: false, message: PIEGE, reason: 'code_inconnu' }
    repondre(404, corps)
    const err = await enrolmentCodesService.rejoindre('ZZZZZZ').catch((e) => e)
    expect(err.response.data).toEqual(corps)
    expect(err.response.data.reason).toBe('code_inconnu')

    repondre(404, corps)
    const j = useJoinClass()
    j.code.value = 'ZZZZZZ'
    await j.rejoindre()
    expect(j.error.value).toBe(ERROR_MESSAGES.codeInconnu)
  })
})
