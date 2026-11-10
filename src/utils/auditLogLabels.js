/**
 * Libellés du journal d'audit (D126/D127) : des tables FERMÉES, en français.
 *
 * Les clés sont celles du serveur, lues dans son code (lms_backend #1014) :
 *  - `action` est une colonne libre (string(32)) : la table couvre tout ce que le serveur ÉCRIT
 *    aujourd'hui, plus les valeurs que le filtre accepte sans que personne ne les écrive encore ;
 *  - le FILTRE, lui, ne propose que les 9 valeurs de la règle `in:` de `ViewAuditLogRequest`
 *    (toute autre valeur rend un 422) ;
 *  - `auditable_type` est un nom de classe complet (aucun modèle audité n'est dans le morph map).
 * Une valeur hors table rend « — » : jamais le code du serveur, jamais un nom de classe PHP,
 * jamais une valeur inventée.
 */

export const AUCUNE_VALEUR = '—'

/** Les 9 actions que le serveur accepte en filtre, dans l'ordre de sa règle `in:`. */
export const AUDIT_FILTRE_ACTIONS = Object.freeze([
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

const ACTIONS = Object.freeze({
  ...Object.fromEntries(AUDIT_FILTRE_ACTIONS),
  // Écrites par le serveur, mais non filtrables (règle `in:` du serveur).
  visio_recording_start: 'Enregistrement visio démarré',
  visio_recording_stop: 'Enregistrement visio arrêté',
  visio_recording_read: 'Enregistrement visio consulté',
  'institution.mode_changed': 'Mode de l’école changé',
  'institution.soft_deleted': 'École supprimée (récupérable)',
  'institution.purged': 'École purgée (définitif)',
  'user.soft_deleted': 'Compte supprimé (récupérable)',
  'user.purged': 'Compte purgé (définitif)',
  'recording.purged': 'Enregistrement purgé',
  'chapter.purged': 'Chapitre purgé',
  'audit-logs.purged.bulk': 'Purge groupée du journal',
})

const ELEMENTS = Object.freeze({
  'App\\Models\\Evaluation': 'Évaluation',
  'App\\Models\\EvaluationSubmission': 'Copie d’évaluation',
  'App\\Models\\QuizAttempt': 'Tentative de quiz',
  'App\\Models\\Institution': 'École',
  'App\\Models\\User': 'Compte',
  'App\\Models\\SeanceRecording': 'Enregistrement visio',
  'App\\Models\\Chapter': 'Chapitre',
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
 * numéro — une valeur RÉELLE, rien d'inventé. Sans école (toute connexion, toute action du
 * supradmin, école purgée sans numéro) : « — ».
 * @param {{institution?: {name?: string}|null, institution_id?: number|null}} entree
 * @returns {string}
 */
export function auditEcoleLabel(entree) {
  const nom = entree?.institution?.name
  if (typeof nom === 'string' && nom.trim()) return nom
  return entree?.institution_id == null ? AUCUNE_VALEUR : `École n° ${entree.institution_id}`
}
