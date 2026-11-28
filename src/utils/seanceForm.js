/**
 * Le formulaire d'une séance LOCALE, partagé par la création (`useSeanceCreate`) et la modification
 * (`useSeanceEdit`, lms_backend#1121) : les messages par champ, la validation et la lecture d'un refus.
 * D0 : un 422 du serveur est rattaché à son champ, jamais affiché tel quel.
 *
 * #675 (lms_backend#1668) : le type et la fin, facultatifs ; un conflit d'horaire (409) nomme les séances en
 * cause, lues ici dans `conflicts` et traduites (`MOTIFS_DE_CONFLIT`).
 */
import { clearCache, clearCacheByPrefix } from '@/services/cache'
import { messageDe } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { MOTIFS_DE_CONFLIT } from '@/constants/typesDeSeance'
import { estPannePassagere } from '@/utils/pannePassagere'
import { isoAvecDecalage } from '@/utils/dateLocale'

// Nos messages par champ ; un 422 du serveur est rattaché au champ, jamais affiché tel quel (D0).
export const MESSAGES_SEANCE = Object.freeze({
  titre: 'Le titre compte de 3 à 255 caractères.',
  date_seance: 'Indiquez la date et l’heure de début.',
  matiere: 'Choisissez la matière de la séance.',
  classe: 'Cette classe ne peut pas être retenue. Choisissez-en une autre.',
  fin: 'La fin doit suivre le début.',
  type: 'Choisissez un type de la liste.',
})
const CHAMP_DU_SERVEUR = Object.freeze({
  titre: 'titre', date_seance: 'date_seance', matiere_id: 'matiere', matiere_nom: 'matiere',
  classe_id: 'classe', classe_nom: 'classe', fin_seance: 'fin', type_seance: 'type',
})

/**
 * Les erreurs du titre, du début et de la fin (les champs communs). La matière, propre à la création, est
 * validée par elle. La fin est facultative ; donnée, elle suit le début.
 * @param {{ titre: string, debut: string, fin?: string }} form
 * @returns {Record<string, string>}
 */
export function erreursTitreEtDebut(form) {
  const e = {}
  const titre = form.titre.trim()
  if (titre.length < 3 || titre.length > 255) e.titre = MESSAGES_SEANCE.titre
  const debut = isoAvecDecalage(form.debut)
  if (debut === null) e.date_seance = MESSAGES_SEANCE.date_seance
  if (form.fin && debut !== null) {
    const fin = isoAvecDecalage(form.fin)
    if (fin === null || new Date(fin) <= new Date(debut)) e.fin = MESSAGES_SEANCE.fin
  }
  return e
}

/**
 * La part « créneau » de la charge : le type et la fin, envoyés seulement s'ils sont donnés (un champ vide
 * ne dit rien au serveur, il ne s'efface pas).
 * @param {{ type?: string, fin?: string }} form
 * @returns {{ type_seance?: string, fin_seance?: string }}
 */
export function chargeDuCreneau(form) {
  const c = {}
  if (form.type) c.type_seance = form.type
  const fin = form.fin ? isoAvecDecalage(form.fin) : null
  if (fin !== null) c.fin_seance = fin
  return c
}

/** Une séance créée ou modifiée doit paraître sur les trois écrans de séances : leurs caches sont purgés. */
export function purgerCachesSeances() {
  clearCache('teacher_seances')
  clearCacheByPrefix('seances_management_d')
  clearCacheByPrefix('admin_seances_d')
}

/**
 * Les séances en conflit d'un 409 `seance_schedule_conflict` : identifiant, titre, bornes et motifs traduits.
 * Rien du texte du serveur ; un motif inconnu est omis. Tout autre refus : aucune.
 * @param {*} err
 * @returns {Array<{ id: number, titre: ?string, debut: string, fin: string, motifs: string[] }>}
 */
export function conflitsDuRefus(err) {
  const corps = err?.response?.data
  if (corps?.reason !== 'seance_schedule_conflict' || !Array.isArray(corps.conflicts)) return []
  return corps.conflicts.map((c) => ({
    id: c.id,
    titre: typeof c.titre === 'string' ? c.titre : null,
    debut: c.date_seance,
    fin: c.fin_effective,
    motifs: (Array.isArray(c.motifs) ? c.motifs : []).map((m) => MOTIFS_DE_CONFLIT[m]).filter(Boolean),
  }))
}

/**
 * Ce que l'écran retient d'un refus : les champs en faute (nos messages), le message général (le
 * motif du catalogue, sinon le statut), le motif, les séances en conflit et la possibilité d'un nouvel essai.
 * @param {*} err
 * @returns {{ erreurs: Record<string, string>, erreur: string, reason: ?string, conflits: Array, canRetry: boolean }}
 */
export function lireRefusSeance(err) {
  const erreurs = {}
  for (const cle of Object.keys(err?.fieldErrors ?? {})) {
    const champ = CHAMP_DU_SERVEUR[cle]
    if (champ) erreurs[champ] = MESSAGES_SEANCE[champ]
  }
  const reason = err?.response?.data?.reason ?? null
  if (reason === 'seance_end_before_start') erreurs.fin = MESSAGES_SEANCE.fin
  return {
    erreurs,
    erreur: err?.fieldErrors ? ERROR_MESSAGES.validation : messageDe(err),
    reason,
    conflits: conflitsDuRefus(err),
    canRetry: estPannePassagere(err),
  }
}
