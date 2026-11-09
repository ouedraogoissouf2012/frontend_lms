/**
 * Les SITES D'APPEL de la visio disent le sens, jamais le texte du serveur (D0).
 *
 * Revue indépendante de la PR : les tests de visioFeedback et du store prouvaient la règle sur
 * les fonctions, mais aucun ne pilotait une branche `success:false` d'un appelant. Revenir à
 * `userError(response.message || '…')` dans useVisioActions restait vert. Même revue : le message
 * rédigé par le front quand le module Jitsi ne se charge pas (« Vérifiez votre connexion… ») était
 * remplacé par le repli générique, faute de passer par `userError`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const lms = vi.hoisted(() => ({ toggleVisio: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/services/confirmDialog', () => ({ confirmDialog: vi.fn().mockResolvedValue(true) }))
vi.mock('@/services/lms', () => ({ default: lms }))
vi.mock('@/services/attendanceExport', () => ({ default: {} }))
vi.mock('@/stores/visio', () => ({ useVisioStore: () => ({}) }))
vi.mock('@/constants/visio', async (original) => ({
  ...(await original()),
  jitsiExternalApiSrc: () => 'https://visio.example.test/external_api.js',
}))

import { useVisioActions } from '@/composables/useVisioActions'
import { loadJitsiExternalApi, resetJitsiExternalApiCache, JITSI_API_LOAD_FAILED_MESSAGE } from '@/composables/useJitsiExternalApi'
import { notifyVisioError } from '@/services/visioFeedback'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const affiche = () => toast.error.mock.calls.at(-1)?.[0]

beforeEach(() => {
  toast.error.mockReset()
  lms.toggleVisio.mockReset()
})

describe('programmer la visio : un refus du serveur', () => {
  const programmer = () => useVisioActions({ seance: { id: 3 } }, vi.fn()).programmerVisio()

  it('avec un `reason` connu : le catalogue, jamais le texte du serveur', async () => {
    lms.toggleVisio.mockResolvedValue({ success: false, message: 'Texte serveur détaillé', reason: 'visio_ended' })
    await programmer()
    expect(affiche()).toBe(ERROR_MESSAGES.visioEnded)
  })

  it('sans `reason` : le repli rédigé par le front, jamais le texte du serveur', async () => {
    lms.toggleVisio.mockResolvedValue({ success: false, message: 'Texte serveur détaillé' })
    await programmer()
    expect(affiche()).toBe('Erreur lors de la programmation')
  })
})

describe('le module Jitsi ne se charge pas', () => {
  beforeEach(() => {
    resetJitsiExternalApiCache()
    delete window.JitsiMeetExternalAPI
    document.head.querySelectorAll('script').forEach((s) => s.remove())
  })

  it('la consigne rédigée par le front (vérifier sa connexion) reste affichée', async () => {
    const chargement = loadJitsiExternalApi()
    document.head.querySelector('script').dispatchEvent(new Event('error'))
    const erreur = await chargement.catch((e) => e)
    notifyVisioError(erreur, "Impossible d'ouvrir la salle de visioconférence")
    expect(affiche()).toBe(JITSI_API_LOAD_FAILED_MESSAGE)
  })
})
