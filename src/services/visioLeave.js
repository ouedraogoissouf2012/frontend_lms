import { apiBaseUrl } from '@/constants/http'
import { useAuthStore } from '@/stores/auth'

/**
 * Envoi fiable de la sortie de visio, y compris à la fermeture de l'onglet (#28 / fix Beacon).
 *
 * Historique : on utilisait `navigator.sendBeacon` vers `/api/seances/:id/leave-visio`
 * — route inexistante ET incompatible avec l'auth `auth:sanctum` (Beacon ne peut
 * pas poser de header Authorization → 401).
 *
 * Correctif : `fetch(..., { keepalive: true })` survit au déchargement de page
 * (comme Beacon) tout en autorisant le header Bearer. Cible la VRAIE route
 * backend : POST /api/lms/seances/{id}/leave (auth:sanctum).
 *
 * @param {number|string} seanceId
 * @returns {Promise<boolean>} true si la requête a pu être émise
 */
export async function sendVisioLeaveBeacon(seanceId) {
  const token = useAuthStore().token
  if (!token) {
    console.warn('[visioLeave] Pas de token, sortie visio non émise')
    return false
  }

  try {
    await fetch(`${apiBaseUrl()}/lms/seances/${seanceId}/leave`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      keepalive: true
    })
    return true
  } catch (error) {
    console.error('[visioLeave] Échec envoi sortie visio:', error)
    return false
  }
}
