/**
 * Logique temporelle pure de la visio (extraite de VisioManager.vue, G8).
 *
 * Fenêtre d'ouverture d'une séance : de 15 min avant `heure_debut` à 30 min après
 * `heure_fin`. Fonctions sans état (testables) consommées par les `computed` du
 * composant — comportement et formats d'affichage strictement identiques.
 */

const WINDOW_BEFORE_MS = 15 * 60 * 1000 // -15 min avant le début
const WINDOW_AFTER_MS = 30 * 60 * 1000 // +30 min après la fin

/**
 * Formate un timestamp ISO en heure locale FR (HH:MM), ou 'N/A' si absent.
 * @param {string|null|undefined} isoTimestamp
 * @returns {string}
 */
export function formatVisioTime(isoTimestamp) {
  if (!isoTimestamp) return 'N/A'
  return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Indique si `now` est dans la fenêtre temporelle de la séance
 * (heure_debut - 15min → heure_fin + 30min).
 * @param {Object} seance
 * @param {Date} now
 * @returns {boolean}
 */
export function isInTimeWindow(seance, now) {
  // Utiliser programmation.heure_debut/fin (ISO 8601)
  if (!seance.programmation?.heure_debut || !seance.programmation?.heure_fin) {
    return false
  }

  const debut = new Date(seance.programmation.heure_debut)
  const fin = new Date(seance.programmation.heure_fin)

  // Fenêtre temporelle: -15min avant, +30min après
  const windowStart = new Date(debut.getTime() - WINDOW_BEFORE_MS)
  const windowEnd = new Date(fin.getTime() + WINDOW_AFTER_MS)

  return now >= windowStart && now <= windowEnd
}

/**
 * Message de compte à rebours avant l'ouverture de la fenêtre
 * ('dans Xh Ymin' / 'dans Y minutes' / 'maintenant' / '').
 * @param {Object} seance
 * @param {Date} now
 * @returns {string}
 */
export function timeWindowMessage(seance, now) {
  if (!seance.programmation?.heure_debut) {
    return ''
  }

  const debut = new Date(seance.programmation.heure_debut)
  const windowStart = new Date(debut.getTime() - WINDOW_BEFORE_MS)

  if (now < windowStart) {
    const diffMinutes = Math.floor((windowStart - now) / 60000)
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    if (hours > 0) {
      return `dans ${hours}h ${minutes}min`
    }
    return `dans ${minutes} minutes`
  }

  return 'maintenant'
}
