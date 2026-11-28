/**
 * #743 : un refus d'une requête `responseType: 'blob'` arrive en `Blob`. L'intercepteur de réponse
 * d'`api.js` le décode UNE fois, avant toute lecture : le message est celui du MOTIF, et un 401 est jugé
 * sur son motif (shouldForceLogout), comme en JSON. Un Blob illisible retombe sur le message du statut.
 *
 * Ici le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé, et il
 * rend le corps comme le navigateur le fait pour une requête `blob` : un Blob.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { adminReportsService } from '@/services/adminReports'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useAuthStore } from '@/stores/auth'

let adaptateurOrigine

function refuser(status, corps, type = 'application/json') {
  api.defaults.adapter = async (config) => {
    const data = config.responseType === 'blob' ? new Blob([corps], { type }) : corps
    const response = { status, statusText: '', data, headers: { 'content-type': type }, config }
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

async function echec(promesse) {
  try {
    await promesse
  } catch (err) {
    return err
  }
  throw new Error('La requête devait échouer.')
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().setSession({ user: { id: 1, role: 'admin' }, token: 't' }, {})
  adaptateurOrigine = api.defaults.adapter
  // Sur /login, l'intercepteur ne redirige pas : seul le jugement du 401 est observé.
  window.history.pushState({}, '', '/login')
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  vi.restoreAllMocks()
})

describe('#743 — un refus en Blob garde son motif', () => {
  it('rapports : le 403 motivé du téléchargement donne le message du motif', async () => {
    refuser(403, JSON.stringify({ success: false, message: 'Texte serveur', reason: 'no_institution' }))

    const err = await echec(adminReportsService.telecharger('a1b2c3d4-0000-4000-8000-000000000001'))

    expect(err.userMessage).toBe(ERROR_MESSAGES.noInstitution)
    expect(err.response.data).toMatchObject({ reason: 'no_institution' })
  })

  it('tout appel en blob, sans relais propre : le motif et les erreurs de champ', async () => {
    refuser(422, JSON.stringify({ success: false, message: 'Validation failed', errors: { annee: ['Année inconnue.'] } }))

    const err = await echec(api.get('/un/fichier', { responseType: 'blob' }))

    expect(err.fieldErrors).toEqual({ annee: ['Année inconnue.'] })
    expect(err.userMessage).toContain('Année inconnue.')
  })

  it('un Blob illisible (page HTML) retombe sur le message du statut, et reste tel quel', async () => {
    refuser(403, '<html><body>Interdit</body></html>', 'text/html')

    const err = await echec(api.get('/un/fichier', { responseType: 'blob' }))

    expect(err.userMessage).toBe(ERROR_MESSAGES.forbidden)
    expect(err.response.data).toBeInstanceOf(Blob)
  })

  it('une réponse JSON ordinaire n est pas touchée', async () => {
    refuser(403, JSON.stringify({ success: false, message: 'Texte serveur', reason: 'no_institution' }))

    const err = await echec(api.get('/une/ressource'))

    expect(err.userMessage).toBe(ERROR_MESSAGES.noInstitution)
  })
})

describe('#743 — un 401 en Blob est jugé sur son motif', () => {
  it('klassci_session_expired : la session LMS n est pas éjectée', async () => {
    const deconnexion = vi.spyOn(useAuthStore(), 'logout')
    refuser(401, JSON.stringify({ success: false, message: 'Session KLASSCI expirée', reason: 'klassci_session_expired' }))

    await echec(api.get('/un/fichier', { responseType: 'blob' }))

    expect(deconnexion).not.toHaveBeenCalled()
  })

  it('un 401 sans motif KLASSCI : déconnexion locale, comme en JSON', async () => {
    const deconnexion = vi.spyOn(useAuthStore(), 'logout').mockImplementation(() => {})
    refuser(401, JSON.stringify({ success: false, message: 'Unauthenticated.' }))

    await echec(api.get('/un/fichier', { responseType: 'blob' }))

    expect(deconnexion).toHaveBeenCalledWith({ revoke: false })
  })
})
