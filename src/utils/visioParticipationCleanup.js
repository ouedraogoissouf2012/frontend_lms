import { VISIO_PARTICIPATION_PREFIX } from '@/constants/storageKeys'
import { PARTICIPATION_EXPIRATION_MS } from '@/constants/visio'

/**
 * Purge des participations visio expirées du localStorage (> 7 jours).
 *
 * Effet de bord historiquement porté par services/jitsi.js (supprimé) : au
 * chargement du module VisioManager, on retire les entrées `visio_participation_*`
 * plus anciennes que PARTICIPATION_EXPIRATION_MS — nettoyage des clés laissées
 * par d'anciennes versions dans le navigateur des utilisateurs. Comportement
 * sur le localStorage identique à l'origine (le console.log de debug est retiré).
 */
export function cleanupExpiredVisioParticipations() {
  const now = Date.now()

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)

    if (key && key.startsWith(VISIO_PARTICIPATION_PREFIX)) {
      const data = localStorage.getItem(key)
      const participation = JSON.parse(data)
      const joinTime = new Date(participation.joined_at).getTime()

      if (now - joinTime > PARTICIPATION_EXPIRATION_MS) {
        localStorage.removeItem(key)
      }
    }
  }
}
