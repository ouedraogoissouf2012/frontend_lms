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

/** Catégorie d'erreur depuis le code HTTP. */
function categoryFromStatus(status) {
  switch (status) {
    case 401: return 'auth'
    case 403: return 'forbidden'
    case 404: return 'notFound'
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

  // Pas de réponse HTTP : erreur réseau si axios (request/code), sinon inconnue.
  if (error.request || error.code || error.isAxiosError) {
    return { category: 'network', userMessage: ERROR_MESSAGES.network, fieldErrors: null }
  }

  return fallback
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
 * par l'URL `/proxy/`, le `reason: 'klassci_session_expired'` ou un message KLASSCI.
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
