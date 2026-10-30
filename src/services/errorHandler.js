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

/**
 * Motifs de refus (#391, ADR-906-01) : quand un même statut porte plusieurs sens, le
 * corps porte `reason`. Un motif CONNU devient une catégorie du catalogue ; un motif
 * inconnu est ignoré et le statut décide (fail-secure : jamais le texte du serveur).
 */
const REASON_CATEGORIES = Object.freeze({
  enrolment_not_active: 'enrolmentNotActive',
  no_institution: 'noInstitution',
  account_quota_exceeded: 'accountQuotaExceeded',
  account_daily_cap_reached: 'accountDailyCapReached',
  institution_cap_reached: 'institutionCapReached',
  // #429 : contrat de POST /lms/seances/{id}/join. Un `reason` serveur est un identifiant de
  // contrat GLOBAL (BusinessException) : s'il prenait un autre sens ailleurs, ce serait un
  // défaut serveur. Catégories préfixées par leur contrat, aucune résolution par écran.
  not_enrolled: 'visioNotEnrolled',
  no_classe_id: 'visioNoClasse',
  visio_not_enabled: 'visioNotEnabled',
  teacher_not_owner: 'visioTeacherNotOwner',
  actor_not_authorized: 'visioRoleRefused',
  invalid_role: 'visioRoleRefused',
  tenant_not_resolved: 'visioNoInstitution',
  // #420 : 401 d'une route adossée à KLASSCI quand ce compte n'a AUCUN accès KLASSCI
  // (compte local, école autonome). Ni une session LMS morte, ni une session KLASSCI
  // expirée : se reconnecter n'y change rien (contrat `KlassciUnauthorized`).
  klassci_token_missing: 'klassciTokenMissing',
})

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
  // Le 503 KLASSCI porte TOUJOURS un en-tête Retry-After (RendersKlassciProxyErrors) ;
  // c'est le marqueur distinctif. Un 503 générique (sans Retry-After) reste « server ».
  if (status === 503 && error.response?.headers?.['retry-after'] != null) {
    return { category: 'klassciUnavailable', userMessage: ERROR_MESSAGES.klassciUnavailable, fieldErrors: null }
  }
  if (typeof reason === 'string' && Object.hasOwn(REASON_CATEGORIES, reason)) {
    const category = REASON_CATEGORIES[reason]
    return { category, userMessage: ERROR_MESSAGES[category], fieldErrors: null }
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
 * Erreur pour une réponse HTTP RÉUSSIE dont l'enveloppe n'est pas celle attendue
 * (`success !== true`). Ne lève jamais : construit l'erreur que l'appelant rejette.
 *
 * Remplacer une telle réponse par une liste vide fabriquait un fait (« aucun cours
 * publié ») à partir d'une anomalie (#436, CONTRIBUTING §10). L'erreur porte un
 * `userMessage` du catalogue, comme celles que pose l'intercepteur d'`api.js` :
 * l'appelant l'affiche sans distinguer les deux origines.
 * @param {string} [context] - libellé technique pour les journaux (jamais affiché).
 * @returns {Error}
 */
export function invalidResponseError(context = '') {
  const error = new Error(context ? `Réponse inattendue : ${context}` : 'Réponse inattendue')
  error.userMessage = ERROR_MESSAGES.unknown
  error.fieldErrors = null
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
