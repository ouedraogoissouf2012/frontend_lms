/**
 * Le formulaire d'une séance LOCALE, partagé par la création (`useSeanceCreate`) et la modification
 * (`useSeanceEdit`, lms_backend#1121) : les messages par champ, la validation et la lecture d'un refus.
 * D0 : un 422 du serveur est rattaché à son champ, jamais affiché tel quel.
 */
import { clearCache, clearCacheByPrefix } from '@/services/cache'
import { messageDe } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { estPannePassagere } from '@/utils/pannePassagere'
import { isoAvecDecalage } from '@/utils/dateLocale'

// Nos messages par champ ; un 422 du serveur est rattaché au champ, jamais affiché tel quel (D0).
export const MESSAGES_SEANCE = Object.freeze({
  titre: 'Le titre compte de 3 à 255 caractères.',
  date_seance: 'Indiquez la date et l’heure de début.',
  matiere: 'Choisissez la matière de la séance.',
  classe: 'Cette classe ne peut pas être retenue. Choisissez-en une autre.',
})
const CHAMP_DU_SERVEUR = Object.freeze({
  titre: 'titre', date_seance: 'date_seance', matiere_id: 'matiere', matiere_nom: 'matiere',
  classe_id: 'classe', classe_nom: 'classe',
})

/**
 * Les erreurs du titre et du début (les champs communs). La matière, propre à la création, est
 * validée par elle.
 * @param {{ titre: string, debut: string }} form
 * @returns {Record<string, string>}
 */
export function erreursTitreEtDebut(form) {
  const e = {}
  const titre = form.titre.trim()
  if (titre.length < 3 || titre.length > 255) e.titre = MESSAGES_SEANCE.titre
  if (isoAvecDecalage(form.debut) === null) e.date_seance = MESSAGES_SEANCE.date_seance
  return e
}

/** Une séance créée ou modifiée doit paraître sur les trois écrans de séances : leurs caches sont purgés. */
export function purgerCachesSeances() {
  clearCache('teacher_seances')
  clearCacheByPrefix('seances_management_d')
  clearCacheByPrefix('admin_seances_d')
}

/**
 * Ce que l'écran retient d'un refus : les champs en faute (nos messages), le message général (le
 * motif du catalogue, sinon le statut), le motif et la possibilité d'un nouvel essai.
 * @param {*} err
 * @returns {{ erreurs: Record<string, string>, erreur: string, reason: ?string, canRetry: boolean }}
 */
export function lireRefusSeance(err) {
  const erreurs = {}
  for (const cle of Object.keys(err?.fieldErrors ?? {})) {
    const champ = CHAMP_DU_SERVEUR[cle]
    if (champ) erreurs[champ] = MESSAGES_SEANCE[champ]
  }
  return {
    erreurs,
    erreur: err?.fieldErrors ? ERROR_MESSAGES.validation : messageDe(err),
    reason: err?.response?.data?.reason ?? null,
    canRetry: estPannePassagere(err),
  }
}
