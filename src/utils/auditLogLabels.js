/**
 * Libellés du journal d'audit (D126/D127) : des tables FERMÉES, en français.
 *
 * Les clés sont celles du serveur : les 9 actions que valide `ViewAuditLogRequest` (`in:`) et
 * les 3 modèles journalisés (`docs/AUDIT_LOG.md` : Evaluation, EvaluationSubmission, QuizAttempt,
 * servis en nom de classe complet dans `auditable_type`). Une valeur hors table rend « — » :
 * jamais le code du serveur, jamais un nom de classe PHP, jamais une valeur inventée.
 */

export const AUCUNE_VALEUR = '—'

/** Actions dans l'ordre de la règle serveur : sert aussi la liste du filtre. */
export const AUDIT_ACTIONS = Object.freeze([
  ['create', 'Création'],
  ['update', 'Modification'],
  ['delete', 'Suppression'],
  ['view', 'Consultation'],
  ['export', 'Export'],
  ['import', 'Import'],
  ['login', 'Connexion'],
  ['logout', 'Déconnexion'],
  ['login_failed', 'Échec de connexion'],
])

const ACTIONS = Object.freeze(Object.fromEntries(AUDIT_ACTIONS))
const ELEMENTS = Object.freeze({
  'App\\Models\\Evaluation': 'Évaluation',
  'App\\Models\\EvaluationSubmission': 'Copie d’évaluation',
  'App\\Models\\QuizAttempt': 'Tentative de quiz',
})

// `hasOwnProperty` : un nom hérité d'objet (« toString », « __proto__ ») n'est pas une clé.
const lire = (table, cle) => (Object.prototype.hasOwnProperty.call(table, cle) ? table[cle] : null)

/** @param {*} action @returns {string} */
export const auditActionLabel = (action) => lire(ACTIONS, action) ?? AUCUNE_VALEUR

/** @param {*} type `auditable_type` @param {*} id `auditable_id` @returns {string} */
export function auditElementLabel(type, id) {
  const libelle = lire(ELEMENTS, type)
  if (!libelle) return AUCUNE_VALEUR
  return id == null ? libelle : `${libelle} n° ${id}`
}

/**
 * L'école d'une entrée : son nom s'il est servi (`institution {id, name}`, D127), sinon son
 * numéro — une valeur RÉELLE, rien d'inventé ; sans école (échec de connexion, plateforme) : « — ».
 * @param {{institution?: {name?: string}|null, institution_id?: number|null}} entree
 * @returns {string}
 */
export function auditEcoleLabel(entree) {
  const nom = entree?.institution?.name
  if (typeof nom === 'string' && nom.trim()) return nom
  return entree?.institution_id == null ? AUCUNE_VALEUR : `École n° ${entree.institution_id}`
}
