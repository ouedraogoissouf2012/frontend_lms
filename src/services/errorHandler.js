/**
 * Gestion centralisée des erreurs côté client (#20).
 *
 * `normalizeError` : fonction PURE qui transforme n'importe quelle erreur (axios,
 * réseau, Error JS, valeur invalide) en un message utilisateur SÛR + une catégorie,
 * sans jamais exposer de détail technique d'infrastructure (équivalence backend
 * PRODUCTION_STANDARDS §1.2). `logError` : journalisation sûre (sans donnée sensible),
 * désactivée en production (modèle logRoleDecision de roles.js).
 *
 * SRP : ce module NORMALISE et JOURNALISE — il N'AFFICHE rien (aucune dépendance d'affichage).
 */
import { ERROR_MESSAGES } from '../constants/errorMessages'
import { libelleDelai } from '../utils/delaiReessai'

/**
 * Motifs de refus (#391, ADR-906-01) : quand un même statut porte plusieurs sens, le
 * corps porte `reason`. Un motif CONNU devient une catégorie du catalogue ; un motif
 * inconnu est ignoré et le statut décide (fail-secure : jamais le texte du serveur).
 */
/**
 * Une entrée du catalogue : la catégorie (clé d'ERROR_MESSAGES) et son caractère TRANSITOIRE.
 * Transitoire : la cause peut passer d'elle-même (« Réessayez dans un instant », délai de
 * Retry-After) ; un nouvel essai a un sens. Sinon le motif est un refus définitif. C'est le SEUL
 * endroit qui le dit : un motif transitoire ajouté ici prend son délai ET garde « Réessayer ».
 */
function motif(categorie, { transitoire = false } = {}) {
  return Object.freeze({ categorie, transitoire })
}

const REASONS = Object.freeze({
  enrolment_not_active: motif('enrolmentNotActive'),
  no_institution: motif('noInstitution'),
  account_quota_exceeded: motif('accountQuotaExceeded'),
  account_daily_cap_reached: motif('accountDailyCapReached'),
  institution_cap_reached: motif('institutionCapReached'),
  // #429 : contrat de POST /lms/seances/{id}/join. Un `reason` serveur est un identifiant de
  // contrat GLOBAL (BusinessException) : s'il prenait un autre sens ailleurs, ce serait un
  // défaut serveur. Catégories préfixées par leur contrat, aucune résolution par écran.
  not_enrolled: motif('visioNotEnrolled'),
  no_classe_id: motif('visioNoClasse'),
  visio_not_enabled: motif('visioNotEnabled'),
  // VisioStatusRefusal (serveur) : attendre (`visio_not_started`) ou renoncer (`visio_ended`).
  visio_not_started: motif('visioNotStarted'),
  visio_ended: motif('visioEnded'),
  teacher_not_owner: motif('visioTeacherNotOwner'),
  actor_not_authorized: motif('visioRoleRefused'),
  invalid_role: motif('visioRoleRefused'),
  tenant_not_resolved: motif('visioNoInstitution'),
  // #420 : 401 d'une route adossée à KLASSCI quand ce compte n'a AUCUN accès KLASSCI
  // (compte local, école autonome). Ni une session LMS morte, ni une session KLASSCI
  // expirée : se reconnecter n'y change rien (contrat `KlassciUnauthorized`).
  klassci_token_missing: motif('klassciTokenMissing'),
  // lms_backend #1011 : refus de démarrage d'une évaluation (POST /evaluations/{id}/start, 403).
  evaluation_window_closed: motif('evaluationWindowClosed'),
  evaluation_max_attempts: motif('evaluationMaxAttempts'),
  evaluation_retake_forbidden: motif('evaluationRetakeForbidden'),
  evaluation_offline_only: motif('evaluationOfflineOnly'),
  evaluation_window_unverifiable: motif('evaluationWindowUnverifiable', { transitoire: true }),
  // frontend_lms#426 : la panne KLASSCI se classe par son motif (le 503 canonique le porte), pas par
  // l'en-tête Retry-After, que le navigateur cache en cross-origin (`exposed_headers: []`).
  klassci_unavailable: motif('klassciUnavailable'),
})

/**
 * Le message du catalogue pour un `reason` du serveur, ou `null` s'il est inconnu. Sert aux
 * réponses `success: false` qui ne passent pas par l'intercepteur : leur `message` n'est
 * jamais affiché (D0), seul leur `reason` l'est, traduit.
 * @param {unknown} reason
 * @returns {string|null}
 */
export function messageForReason(reason) {
  const entree = entreeDuMotif(reason)
  return entree ? (ERROR_MESSAGES[entree.categorie] ?? null) : null
}

/** L'entrée du catalogue pour un `reason`, ou `null` (inconnu, absent, clé du prototype). */
function entreeDuMotif(reason) {
  return typeof reason === 'string' && Object.hasOwn(REASONS, reason) ? REASONS[reason] : null
}

/**
 * Le refus MOTIVÉ d'une réponse 2xx « success: false » : le message du catalogue de son `reason`,
 * et s'il est définitif. Définitif = motif connu ET non transitoire (lu dans le catalogue) ; un
 * motif transitoire ou inconnu laisse « Réessayer ». La seule règle, partagée par tous les sites.
 * @param {{ reason?: unknown }|null|undefined} response
 * @returns {{ motif: string|null, definitif: boolean }}
 */
export function refusMotive(response) {
  const entree = entreeDuMotif(response?.reason)
  const motifConnu = entree ? (ERROR_MESSAGES[entree.categorie] ?? null) : null
  return { motif: motifConnu, definitif: motifConnu !== null && !entree.transitoire }
}

// Catégories TRANSITOIRES : leur message finit par « Réessayez dans un instant. », que le délai
// de Retry-After précise. Un refus définitif ne prend jamais de délai.
// Dérivées du catalogue (jamais une seconde liste à tenir à jour à la main).
export const CATEGORIES_A_DELAI = Object.freeze(new Set(
  Object.values(REASONS).filter((entree) => entree.transitoire).map((entree) => entree.categorie),
))
const DANS_UN_INSTANT = 'Réessayez dans un instant.'

/** Le message d'une catégorie transitoire, avec le délai de `Retry-After` s'il est lisible. */
function avecDelai(category, message, error) {
  if (!CATEGORIES_A_DELAI.has(category) || !message?.endsWith(DANS_UN_INSTANT)) return message
  const delai = libelleDelai(error.response?.headers?.['retry-after'])
  return `${message.slice(0, -DANS_UN_INSTANT.length)}Réessayez ${delai}.`
}

/** Catégorie d'erreur depuis le code HTTP. */
function categoryFromStatus(status) {
  switch (status) {
    case 401: return 'auth'
    case 403: return 'forbidden'
    case 404: return 'notFound'
    // État changé ailleurs, ou opération hors du graphe d'états (#391).
    case 409: return 'conflict'
    case 410: return 'gone'
    case 422: return 'validation'
    case 429: return 'rateLimit'
    default: return status >= 500 ? 'server' : 'unknown'
  }
}

/**
 * Extrait les erreurs de validation par champ (format Laravel `{champ: [messages]}`).
 * @returns {object|null} l'objet d'erreurs si non vide, sinon null.
 */
function extractFieldErrors(error) {
  const errs = error?.response?.data?.errors
  if (errs && typeof errs === 'object' && !Array.isArray(errs) && Object.keys(errs).length > 0) {
    return errs
  }
  return null
}

/** Message agrégé sûr pour 422 : concatène les libellés de champ (non sensibles). */
function aggregateValidation(fieldErrors) {
  const msgs = Object.values(fieldErrors).flat().filter((m) => typeof m === 'string')
  return msgs.length ? msgs.join(' ') : ERROR_MESSAGES.validation
}

/**
 * Normalise une erreur en message utilisateur sûr. Ne lève JAMAIS.
 * Seule la catégorie `validation` (422) peut agréger des messages serveur (champs) ;
 * toutes les autres forcent le message du catalogue (fail-secure, pas de fuite).
 * @param {unknown} error
 * @returns {{category: string, userMessage: string, fieldErrors: object|null}}
 */
export function normalizeError(error) {
  const fallback = { category: 'unknown', userMessage: ERROR_MESSAGES.unknown, fieldErrors: null }
  if (!error || typeof error !== 'object') return fallback

  const status = error.response?.status

  // #240 : erreurs du proxy KLASSCI distinguées par le back (RendersKlassciProxyErrors) :
  //  - 401 { reason: 'klassci_session_expired' } : la session KLASSCI (pas la session
  //    LMS Sanctum) a expiré → message actionnable, PAS de déconnexion (cf. shouldForceLogout).
  //  - 503 (+ Retry-After) : KLASSCI temporairement indisponible → message « réessayez ».
  // Sans cela, ces cas retombaient sur « auth »/« server » génériques et les
  // dashboards KLASSCI restaient muets.
  const reason = error.response?.data?.reason
  if (reason === 'klassci_session_expired') {
    return { category: 'klassciExpired', userMessage: ERROR_MESSAGES.klassciExpired, fieldErrors: null }
  }
  // Un motif CONNU prime sur la règle générique du Retry-After (décision de la superviseure) : un
  // 503 qui dit son motif (`evaluation_window_unverifiable`, #1019) ne devient pas « KLASSCI
  // indisponible ».
  if (entreeDuMotif(reason)) {
    const category = REASONS[reason].categorie
    return { category, userMessage: avecDelai(category, ERROR_MESSAGES[category], error), fieldErrors: null }
  }
  // Repli, sans motif connu, pour un serveur qui ne pose pas encore `klassci_unavailable` (#426) : le
  // 503 KLASSCI porte un en-tête Retry-After (RendersKlassciProxyErrors). Invisible en cross-origin,
  // ce repli ne vaut qu'en même origine. Sans lui, un 503 reste « server ».
  if (status === 503 && error.response?.headers?.['retry-after'] != null) {
    return { category: 'klassciUnavailable', userMessage: avecDelai('klassciUnavailable', ERROR_MESSAGES.klassciUnavailable, error), fieldErrors: null }
  }

  if (status != null) {
    const category = categoryFromStatus(status)
    if (category === 'validation') {
      const fieldErrors = extractFieldErrors(error)
      return {
        category,
        fieldErrors,
        userMessage: fieldErrors ? aggregateValidation(fieldErrors) : ERROR_MESSAGES.validation,
      }
    }
    return { category, userMessage: ERROR_MESSAGES[category] ?? ERROR_MESSAGES.unknown, fieldErrors: null }
  }

  // Dépassement de délai : la connexion FONCTIONNE, c'est le serveur qui n'a pas
  // répondu à temps. On le sépare de `network` pour ne pas envoyer l'utilisateur
  // vérifier une connexion qui n'est pas en cause. `ECONNABORTED` est le code
  // qu'axios pose sur un timeout côté client ; `ETIMEDOUT` vient de la couche
  // système. Le message du catalogue est utilisé tel quel — jamais `error.message`,
  // qui expose le délai configuré (« timeout of 30000ms exceeded »).
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return { category: 'timeout', userMessage: ERROR_MESSAGES.timeout, fieldErrors: null }
  }

  // Pas de réponse HTTP : erreur réseau si axios (request/code), sinon inconnue.
  if (error.request || error.code || error.isAxiosError) {
    return { category: 'network', userMessage: ERROR_MESSAGES.network, fieldErrors: null }
  }

  return fallback
}

/**
 * Requête annulée par l'appelant (AbortController → `signal`) : ce n'est PAS un échec
 * à montrer — une requête plus récente l'a remplacée. Axios pose `ERR_CANCELED`.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isCanceled(error) {
  return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
}

/**
 * Erreur pour une réponse HTTP RÉUSSIE dont l'enveloppe n'est pas celle attendue
 * (`success !== true`). Ne lève jamais : construit l'erreur que l'appelant rejette.
 *
 * Remplacer une telle réponse par une liste vide fabriquait un fait (« aucun cours
 * publié ») à partir d'une anomalie (#436, CONTRIBUTING §10). L'erreur porte un
 * `userMessage` du catalogue, comme celles que pose l'intercepteur d'`api.js` :
 * l'appelant l'affiche sans distinguer les deux origines.
 *
 * Le `reason` connu donne son message du catalogue ; il n'est `definitif` (pas de « Réessayer »)
 * que s'il n'est pas transitoire (refusMotive). Sans `reason` connu, l'anomalie reste une panne.
 * @param {string} [context] - libellé technique pour les journaux (jamais affiché).
 * @param {{ reason?: unknown }|null} [response] - le corps reçu, pour son seul `reason`.
 * @returns {Error & { userMessage: string, fieldErrors: null, definitif?: true }}
 */
export function invalidResponseError(context = '', response = null) {
  const error = new Error(context ? `Réponse inattendue : ${context}` : 'Réponse inattendue')
  const refus = refusMotive(response)
  error.userMessage = refus.motif ?? ERROR_MESSAGES.unknown
  error.fieldErrors = null
  if (refus.definitif) error.definitif = true
  return error
}

/**
 * Décide si une erreur HTTP doit invalider la SESSION locale (déconnexion).
 *
 * Règle (#231) : côté LMS, un refus d'autorisation/rôle renvoie 403 (EnsureRole),
 * jamais 401. Un 401 signifie donc que le token de session Sanctum est
 * invalide/expiré/révoqué → il FAUT déconnecter et rediriger vers /login (sinon
 * l'utilisateur reste bloqué sur une page cassée en boucle après expiration).
 *
 * EXCEPTION : un 401 lié à la session KLASSCI (appels proxy, token KLASSCI
 * manquant/expiré) ne doit PAS éjecter la session LMS — l'utilisateur peut se
 * ré-authentifier auprès de KLASSCI sans perdre sa session LMS. On l'identifie
 * par l'URL `/proxy/`, le `reason` serveur — `klassci_session_expired`, ou
 * `klassci_token_missing` (#420 : ce compte n'a aucun accès KLASSCI ; règle
 * explicite pour toute route adossée à KLASSCI, `/proxy/` ou non) — ou un message KLASSCI.
 *
 * Fonction PURE, ne lève jamais.
 *
 * @param {unknown} error
 * @returns {boolean} true s'il faut déconnecter l'utilisateur.
 */
export function shouldForceLogout(error) {
  if (error?.response?.status !== 401) return false

  const url = error.config?.url ?? ''
  const data = error.response?.data ?? {}

  // Exceptions KLASSCI : ne pas éjecter la session LMS pour un souci KLASSCI.
  if (url.includes('/proxy/')) return false
  if (data.reason === 'klassci_session_expired') return false
  if (data.reason === 'klassci_token_missing') return false
  if (/klassci/i.test(String(data.message ?? ''))) return false

  // Tout autre 401 = session Sanctum invalide/expirée → déconnexion.
  return true
}

/**
 * Journalise une erreur de façon SÛRE (catégorie, status, url) — jamais de token,
 * email ni corps de requête. Désactivée en production (#15).
 * @param {unknown} error
 * @param {string} context - libellé de contexte (ex. nom de l'appelant).
 */
export function logError(error, context = '') {
  if (import.meta.env?.PROD) return
  const safe = {
    category: normalizeError(error).category,
    status: error?.response?.status ?? null,
    url: error?.config?.url ?? null,
  }
  console.warn(`[errorHandler] ${context}`, safe)
}
