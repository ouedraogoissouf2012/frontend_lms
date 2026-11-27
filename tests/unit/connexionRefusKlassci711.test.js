/**
 * #711 (écran de lms_backend#1739) — sur la page de connexion, le refus du COMPTE par KLASSCI dit à l'élève quoi
 * faire, par le VRAI client HTTP (`api.js`, ses intercepteurs) et le vrai store : seul l'adaptateur réseau est remplacé.
 *
 * Contrat serveur : 403 `klassci_account_refused`, `message` = le motif de KLASSCI, NETTOYÉ par le serveur
 * (balises retirées, 300 caractères au plus) et écrit pour l'élève. C'est la seule exception voulue à D0 : ce
 * motif est le seul texte qui dise quoi faire. Vide, le catalogue prend le relais. Les textes du 401 et du 503 ne
 * changent pas.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { messageConnexion } from '@/utils/messageConnexion'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const NON_REINSCRIT = 'Vous n’êtes pas encore réinscrit pour l’année universitaire en cours. Veuillez contacter le secrétariat pour procéder à votre réinscription.'
let adaptateurOrigine

function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

async function echecDeConnexion() {
  return useAuthStore().login('eleve@ecole.ci', 'mot-de-passe').catch((e) => e)
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('connexion : le refus du compte par KLASSCI (#711)', () => {
  it('403 klassci_account_refused : le motif de KLASSCI est dit tel quel', async () => {
    repondre(403, { success: false, message: NON_REINSCRIT, reason: 'klassci_account_refused' })
    expect(messageConnexion(await echecDeConnexion())).toBe(NON_REINSCRIT)
  })

  it('403 klassci_account_refused sans message : le texte du catalogue', async () => {
    repondre(403, { success: false, message: '   ', reason: 'klassci_account_refused' })
    expect(messageConnexion(await echecDeConnexion())).toBe(ERROR_MESSAGES.compteRefuseParKlassci)
  })

  it('un autre 403 ne montre jamais le texte du serveur (D0)', async () => {
    repondre(403, { success: false, message: 'Texte serveur, jamais affiché' })
    expect(messageConnexion(await echecDeConnexion())).not.toContain('Texte serveur')
  })

  it('401 : identifiants incorrects, inchangé', async () => {
    repondre(401, { success: false, message: 'Identifiants incorrects' })
    expect(messageConnexion(await echecDeConnexion())).toBe(ERROR_MESSAGES.identifiantsIncorrects)
  })

  it('503 : KLASSCI injoignable, le texte de sa catégorie, jamais celui du refus de compte', async () => {
    repondre(503, { success: false, message: 'Texte serveur, jamais affiché' })
    const message = messageConnexion(await echecDeConnexion())
    expect(message).not.toContain('Texte serveur')
    expect(message).not.toBe(ERROR_MESSAGES.compteRefuseParKlassci)
    expect(message).not.toBe(ERROR_MESSAGES.identifiantsIncorrects)
  })
})
