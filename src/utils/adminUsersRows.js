import { getFullName } from '@/utils/formatters'
import { ROLES, normalizeRole } from '@/constants/roles'
import { getEnseignantClassesLabel, getEnseignantUniqueClasses } from '@/utils/enseignants'

/**
 * Construction des lignes du tableau d'annuaire, à partir des TROIS populations.
 *
 * Extrait de `useAdminUsers` (≤300 l.) quand la troisième population est arrivée :
 * le composable orchestre le chargement, ce module décrit la forme des lignes.
 *
 * Le `role` porté par chaque ligne est toujours CANONIQUE : c'est lui que compare
 * le filtre de la barre d'outils. Un `superAdmin` doit répondre au filtre
 * « Administrateurs » (rôle canonique `admin`), sans quoi la ligne existerait
 * dans le tableau mais deviendrait introuvable dès qu'on filtre.
 */

/**
 * Étudiants issus du roster KLASSCI.
 *
 * @param {Array<object>} etudiants
 * @returns {Array<object>}
 */
export function etudiantRows(etudiants) {
  return (etudiants ?? []).map((e) => ({
    _uid: `etu-${e.id}`,
    klassci_id: e.id,
    name: getFullName(e),
    email: e.email,
    role: ROLES.ETUDIANT,
    classe_id: e.classe_id,
    classe_nom: e.classe_nom,
    matricule: e.matricule,
    telephone: e.telephone,
  }))
}

/**
 * Enseignants issus de la liste enrichie KLASSCI.
 *
 * Le rôle est FORCÉ : `/proxy/enseignants` renvoie `"role":"etudiant"` pour un
 * professeur (donnée amont fausse, vérifiée contre l'API). La source de vérité
 * est l'endpoint interrogé, pas le champ.
 *
 * @param {Array<object>} enseignants
 * @returns {Array<object>}
 */
export function enseignantRows(enseignants) {
  return (enseignants ?? []).map((e) => ({
    _uid: `ens-${e.id || e.teacher_id}`,
    klassci_id: e.id || e.teacher_id,
    name: getFullName(e),
    email: e.email,
    role: ROLES.ENSEIGNANT,
    // Classes DÉRIVÉES des matières (helper canonique), jamais un `null` en dur.
    classe_id: null,
    classe_ids: getEnseignantUniqueClasses(e).map((c) => c.id),
    classe_nom: getEnseignantClassesLabel(e),
    matricule: e.matricule,
    telephone: e.telephone,
    specialization: e.specialization,
  }))
}

/**
 * Comptes d'encadrement, issus de la base LMS (`GET /admin/users`).
 *
 * Ces comptes n'ont pas d'équivalent KLASSCI : ni classe, ni matricule, ni
 * téléphone. Ces champs restent `null` — la donnée n'existe pas, elle n'est pas
 * « vide ».
 *
 * @param {Array<object>} administration
 * @returns {Array<object>}
 */
export function administrationRows(administration) {
  return (administration ?? []).map((u) => ({
    _uid: `lms-${u.id}`,
    lms_id: u.id,
    klassci_id: u.klassci_id ?? null,
    name: u.name,
    email: u.email,
    role: normalizeRole(u.role),
    classe_id: null,
    classe_nom: null,
    matricule: null,
    telephone: null,
    created_at: u.created_at ?? null,
  }))
}

/**
 * Liste unifiée des trois populations.
 *
 * @param {{etudiants?: Array<object>, enseignants?: Array<object>, administration?: Array<object>}} sources
 * @returns {Array<object>}
 */
export function buildUserRows({ etudiants, enseignants, administration } = {}) {
  return [
    ...etudiantRows(etudiants),
    ...enseignantRows(enseignants),
    ...administrationRows(administration),
  ]
}
