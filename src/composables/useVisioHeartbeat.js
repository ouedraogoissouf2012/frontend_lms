import { ref } from 'vue'
import lmsService from '@/services/lms'
import { VISIO_CONFIG } from '@/constants/visio'

/**
 * Moteur de heartbeat visio partagé (#26).
 *
 * Mutualise la logique Web Worker (+ fallback setInterval) qui était
 * dupliquée à l'identique entre le store global (`stores/visio.js`) et le
 * composable de liaison composant (`composables/useVisioParticipation.js`).
 *
 * Le Worker (`/heartbeat-worker.js`) émet un message `heartbeat` toutes les
 * `VISIO_CONFIG.HEARTBEAT_INTERVAL_MS` ms ; on relaie alors un ping serveur.
 * Si le Worker n'est pas supporté, on retombe sur un setInterval.
 *
 * @param {Object} opts
 * @param {() => (number|string|null)} opts.getSeanceId - séance active courante
 * @param {() => boolean} opts.isActive - true si une participation est en cours
 * @param {() => void} [opts.onParticipationLost] - appelé sur 404 (participation perdue côté serveur)
 * @param {string} [opts.logPrefix] - préfixe des logs (identité de l'appelant)
 * @returns {{ start: () => void, stop: () => void, sendHeartbeat: () => Promise<void> }}
 */
export function useVisioHeartbeat({
  getSeanceId,
  isActive,
  onParticipationLost,
  logPrefix = '[VisioHeartbeat]'
}) {
  const worker = ref(null)
  let fallbackInterval = null

  /** Envoyer un heartbeat (ping d'activité) au serveur pour la séance active. */
  const sendHeartbeat = async () => {
    const seanceId = getSeanceId()
    if (!isActive() || !seanceId) return

    try {
      await lmsService.heartbeatVisio(seanceId)
      console.log(`${logPrefix} 💓 Heartbeat envoyé (séance ${seanceId})`)
    } catch (error) {
      console.error(`${logPrefix} Erreur heartbeat:`, error)
      // 404 = participation introuvable côté serveur : on arrête et on prévient.
      if (error.response?.status === 404) {
        console.warn(`${logPrefix} ⚠️ Participation non trouvée, arrêt heartbeat`)
        stop()
        onParticipationLost?.()
      }
    }
  }

  /** Fallback si le Web Worker n'est pas supporté. */
  const fallback = () => {
    console.warn(`${logPrefix} Fallback sur setInterval (Worker non supporté)`)
    if (fallbackInterval) clearInterval(fallbackInterval)
    sendHeartbeat()
    fallbackInterval = setInterval(sendHeartbeat, VISIO_CONFIG.HEARTBEAT_INTERVAL_MS)
  }

  /** Démarrer le heartbeat (Web Worker, fallback setInterval si indisponible). */
  const start = () => {
    stop()

    try {
      worker.value = new Worker('/heartbeat-worker.js')

      worker.value.addEventListener('message', async (e) => {
        const { type } = e.data || {}
        if (type === 'heartbeat') {
          await sendHeartbeat()
        } else if (type === 'started') {
          console.log(`${logPrefix} 💓 Worker démarré`)
        } else if (type === 'stopped') {
          console.log(`${logPrefix} 💔 Worker arrêté`)
        } else if (type === 'error') {
          console.error(`${logPrefix} Erreur Worker:`, e.data.error)
        }
      })

      worker.value.addEventListener('error', (error) => {
        console.error(`${logPrefix} Erreur Worker:`, error)
      })

      worker.value.postMessage({ command: 'start', interval: VISIO_CONFIG.HEARTBEAT_INTERVAL_MS })
      sendHeartbeat() // premier ping immédiat
      console.log(`${logPrefix} 💓 Heartbeat démarré (Web Worker)`)
    } catch (error) {
      console.error(`${logPrefix} Erreur création Worker:`, error)
      fallback()
    }
  }

  /** Arrêter le heartbeat (Worker ou fallback). */
  const stop = () => {
    if (worker.value) {
      worker.value.postMessage({ command: 'stop' })
      worker.value.terminate()
      worker.value = null
      console.log(`${logPrefix} 💔 Worker terminé`)
    }
    if (fallbackInterval) {
      clearInterval(fallbackInterval)
      fallbackInterval = null
    }
  }

  return { start, stop, sendHeartbeat }
}
