import { apiOrigin } from '@/constants/http'

/**
 * Collecteur de violations CSP (#297, étape 2 de #279).
 *
 * Tant que la CSP est en Report-Only, les violations ne sont visibles que dans la
 * console de CHAQUE utilisateur final → aucun signal en multi-tenant avant la
 * bascule enforce. Ce collecteur écoute l'événement moteur `securitypolicyviolation`
 * (que le neutering `console.*` prod de main.js NE masque PAS) et envoie un rapport
 * best-effort au backend. Dégrade proprement : no-op tant que l'endpoint
 * `/csp-report` n'existe pas (le beacon échoue en silence).
 */

/** Champs UTILES et non sensibles d'une violation (on n'exfiltre pas `originalPolicy`). */
export function buildCspReport(event) {
  return {
    documentURI: event.documentURI,
    blockedURI: event.blockedURI,
    violatedDirective: event.violatedDirective,
    effectiveDirective: event.effectiveDirective,
    disposition: event.disposition, // 'report' (report-only) vs 'enforce'
    sourceFile: event.sourceFile,
    lineNumber: event.lineNumber,
    columnNumber: event.columnNumber,
  }
}

/**
 * Envoie un rapport de violation en best-effort (`navigator.sendBeacon`) vers
 * `${apiOrigin()}/csp-report`. No-op (retourne false) si l'origine API est absente,
 * si `apiOrigin()` lève (build mal configuré) ou si `sendBeacon` n'existe pas.
 * @param {SecurityPolicyViolationEvent} event
 * @returns {boolean} true si le beacon a été mis en file.
 */
export function reportCspViolation(event) {
  let origin
  try {
    origin = apiOrigin()
  } catch {
    return false
  }
  if (!origin || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false
  }
  try {
    const body = new Blob([JSON.stringify(buildCspReport(event))], { type: 'application/json' })
    return navigator.sendBeacon(`${origin}/csp-report`, body)
  } catch {
    return false
  }
}

/** Installe l'écoute des violations CSP sur `target` (le document par défaut). */
export function installCspReporter(target = document) {
  target.addEventListener('securitypolicyviolation', reportCspViolation)
}
