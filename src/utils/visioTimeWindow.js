/**
 * Logique temporelle pure de la visio (extraite de VisioManager.vue, G8).
 *
 * Fenêtre d'ouverture d'une séance : de 15 min avant `heure_debut` à 30 min après
 * `heure_fin`. Fonctions sans état (testables) consommées par les `computed` du
 * composant — comportement et formats d'affichage strictement identiques.
 */

import { dateHeureSeance } from './seanceStatut'

const WINDOW_BEFORE_MS = 15 * 60 * 1000 // -15 min avant le début
const WINDOW_AFTER_MS = 30 * 60 * 1000 // +30 min après la fin

// Ce que l'écran dit à la place de « Démarrer la visio » quand la fenêtre est passée.
export const VISIO_SEANCE_PASSEE = 'Séance passée : la visio ne peut plus être démarrée.'

const dateLisible = (valeur) => {
  const date = valeur ? new Date(valeur) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

/**
 * Fin de la fenêtre où la visio peut encore démarrer. Celle du SERVEUR quand la charge la porte
 * (`end_window`, SeanceVisioEnricher::buildVisioWindow) ; sinon la même règle depuis l'horaire : la fin
 * de la séance + 30 min (heure ISO de l'école LMS, ou jour + « HH:mm » de KLASSCI, dans `programmation`
 * ou à la racine). Null si l'horaire est illisible : rien n'est inventé.
 * @param {Object} seance
 * @returns {Date|null}
 */
export function finDeFenetreVisio(seance) {
  const serveur = seance?.visio_window?.end_window ?? seance?.visio?.window?.end_window
  if (serveur) return dateLisible(serveur)
  const p = seance?.programmation ?? {}
  const heureFin = p.heure_fin ?? seance?.heure_fin
  // Une heure ISO (école LMS) porte son jour : elle se lit seule. « HH:mm » (KLASSCI) a besoin du jour.
  const fin = (String(heureFin ?? '').includes('T') ? dateLisible(heureFin)
    : dateHeureSeance(p.date ?? p.date_seance ?? seance?.date_seance, heureFin)) ?? dateLisible(seance?.date_fin)
  return fin ? new Date(fin.getTime() + WINDOW_AFTER_MS) : null
}

/**
 * Vrai si la visio ne peut plus démarrer : la fenêtre est passée. Un horaire illisible n'est jamais
 * « passé » : le bouton reste, et le serveur tranche.
 * @param {Object} seance
 * @param {Date} [now]
 * @returns {boolean}
 */
export function visioPassee(seance, now = new Date()) {
  const fin = finDeFenetreVisio(seance)
  return fin !== null && now > fin
}

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
