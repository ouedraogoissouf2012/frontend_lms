import { ref } from 'vue'
import { loadJitsiExternalApi } from '@/composables/useJitsiExternalApi'
import {
  RECORDING_CONFIRMATION_TIMEOUT_MS,
  VISIO_ROOM_REQUIRED_MESSAGE,
  VISIO_TOKEN_REQUIRED_MESSAGE,
} from '@/constants/visio'
import { jitsiConfigOverwrite } from '@/constants/visioNetwork'

const RECORDING_NOT_CONFIRMED_MESSAGE =
  "L'enregistrement n'a pas été confirmé par le serveur. Il n'a pas démarré : prévenez votre administrateur."

const ROOM_NOT_MOUNTED_MESSAGE = "Aucune salle n'est ouverte."

const RECORDING_STATUS_EVENT = 'recordingStatusChanged'

/**
 * Frontière unique du dépôt avec l'IFrame API de Jitsi (#673).
 *
 * ## Pourquoi l'ordre d'enregistrement part d'ici, et pas du backend
 *
 * Seul un client Jitsi authentifié comme modérateur peut demander un
 * enregistrement à Jicofo — et c'est Jicofo qui publie `jibri-recording-status`
 * dans le salon, donc qui affiche le bandeau de consentement à TOUS les
 * participants. Piloter Jibri directement depuis le backend enregistrerait des
 * personnes sans les en informer.
 *
 * ## Pourquoi une promesse plutôt qu'un simple `executeCommand`
 *
 * `executeCommand` ne rend rien et n'échoue jamais : c'est un message posté
 * dans une iframe. Le défaut #673 vient exactement de là — le LMS écrivait
 * « enregistrement en cours » sans que rien ne l'ait confirmé, pendant que
 * Jibri restait `IDLE`. Ici la promesse ne se tient que sur l'événement
 * `recordingStatusChanged` émis par le fournisseur.
 *
 * @param {{ loadExternalApi?: () => Promise<Function>, timeoutMs?: number }} [options]
 */
export function useJitsiRoom({
  loadExternalApi = loadJitsiExternalApi,
  timeoutMs = RECORDING_CONFIRMATION_TIMEOUT_MS,
} = {}) {
  const isRecording = ref(false)

  let api = null
  /** @type {Array<[string, Function]>} écouteurs posés, pour un détachement exhaustif */
  let attached = []
  /** @type {Array<[string, Function]>} écouteurs demandés avant le montage */
  const requested = []

  function attach(event, handler) {
    api.addListener(event, handler)
    attached.push([event, handler])
  }

  /**
   * Enregistre un écouteur. Utilisable AVANT le montage : les appelants posent
   * leurs gestionnaires de sortie au moment où ils construisent la salle, pas
   * après, sinon un départ immédiat passerait inaperçu.
   */
  function on(event, handler) {
    requested.push([event, handler])
    if (api) attach(event, handler)
  }

  /**
   * @param {object} options
   * @param {object} [options.configOverwrite] configuration Jitsi. Injectée pour
   *   que ce composable ignore l'existence des modes réseau (#328) : il monte
   *   une salle, il ne décide pas de ce qu'elle coûte à l'apprenant.
   */
  async function mount({ domain, roomName, jwt, displayName, parentNode, configOverwrite }) {
    // Valider AVANT d'instancier : une iframe créée puis abandonnée laisse une
    // connexion ouverte et un nœud orphelin dans la page.
    if (!roomName) throw new Error(VISIO_ROOM_REQUIRED_MESSAGE)
    if (typeof jwt !== 'string' || jwt.trim() === '') throw new Error(VISIO_TOKEN_REQUIRED_MESSAGE)
    if (!parentNode) throw new Error(ROOM_NOT_MOUNTED_MESSAGE)

    const JitsiMeetExternalAPI = await loadExternalApi()

    // La configuration vient de `constants/visioNetwork` et de nulle part
    // ailleurs. Sans choix explicite, on retombe sur le profil par défaut — ce
    // qui garde ce composable utilisable seul, en test comme en reprise.
    api = new JitsiMeetExternalAPI(domain, {
      roomName,
      jwt,
      parentNode,
      userInfo: displayName ? { displayName } : undefined,
      configOverwrite: configOverwrite ?? jitsiConfigOverwrite(),
    })

    attach(RECORDING_STATUS_EVENT, (payload) => {
      isRecording.value = payload?.on === true
    })
    requested.forEach(([event, handler]) => attach(event, handler))
  }

  function dispose() {
    if (!api) return
    attached.forEach(([event, handler]) => api.removeListener(event, handler))
    attached = []
    api.dispose()
    api = null
    isRecording.value = false
  }

  /**
   * Attend que le fournisseur confirme l'état demandé.
   *
   * Le délai de garde est fixé à partir de deux faits mesurés, pas d'une
   * intuition : Jibri a mis 8,3 s puis 23,9 s à démarrer (journaux Jicofo du
   * 2026-08-31), et Jicofo lui-même patiente `pending-timeout = "90 seconds"`
   * (`/run/jicofo/config/jicofo.conf:104`). Conclure à l'échec avant Jicofo
   * ferait enregistrer Jibri sans que le LMS ait rien persisté — précisément
   * l'orphelin que ce chantier doit éviter. Le chemin d'échec normal reste
   * l'événement explicite du fournisseur, bien plus rapide.
   */
  function awaitRecordingState(expectedOn) {
    return new Promise((resolve, reject) => {
      let timer = null

      const settle = (finish) => {
        clearTimeout(timer)
        api?.removeListener(RECORDING_STATUS_EVENT, onStatus)
        attached = attached.filter(([, handler]) => handler !== onStatus)
        finish()
      }

      function onStatus(payload) {
        if (payload?.error) {
          settle(() => reject(new Error(String(payload.error))))
          return
        }
        if (payload?.on === expectedOn) settle(resolve)
      }

      timer = setTimeout(
        () => settle(() => reject(new Error(RECORDING_NOT_CONFIRMED_MESSAGE))),
        timeoutMs,
      )
      attach(RECORDING_STATUS_EVENT, onStatus)
    })
  }

  function command(name, expectedOn) {
    if (!api) return Promise.reject(new Error(ROOM_NOT_MOUNTED_MESSAGE))
    const confirmed = awaitRecordingState(expectedOn)
    api.executeCommand(name, { mode: 'file' })
    return confirmed
  }

  const startRecording = () => command('startRecording', true)
  const stopRecording = () => command('stopRecording', false)

  return { isRecording, mount, dispose, on, startRecording, stopRecording }
}

export { RECORDING_NOT_CONFIRMED_MESSAGE, ROOM_NOT_MOUNTED_MESSAGE }
