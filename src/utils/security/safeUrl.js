/**
 * Durcissement URL (sécurité #XSS) — neutralise les schémas dangereux dans les
 * `:href` / `:src` alimentés par des données utilisateur (chapter.external_link,
 * chapter.video_url, etc.).
 *
 * Vue NE filtre PAS les URLs de binding : `:href="'javascript:alert(1)'"` produit
 * un lien exécutable au clic (XSS). Cette fonction impose une allowlist de schémas.
 *
 * Défense en profondeur :
 *  - supprime les caractères de contrôle ASCII/C1 (0x00-0x1F, 0x7F-0x9F) que les
 *    navigateurs tolèrent À L'INTÉRIEUR d'un schéma ("java\tscript:") ;
 *  - normalise la casse via l'analyseur natif `URL` (protocole en minuscules) —
 *    bloque `JavaScript:` ;
 *  - rejette data:, vbscript:, blob:, file:, et tout schéma hors allowlist.
 */

/** Schémas autorisés pour un lien cliquable rendu dans le DOM. */
const SAFE_SCHEMES = Object.freeze(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * Retire les caractères de contrôle C0 (0x00-0x1F), DEL (0x7F) et C1 (0x80-0x9F).
 * Empêche l'évasion de schéma type "java\tscript:" ou "\x01javascript:".
 * @param {string} s
 * @returns {string}
 */
function stripControlChars(s) {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) continue
    out += s[i]
  }
  return out
}

/**
 * @param {unknown} raw  URL fournie par l'utilisateur/backend.
 * @param {{ fallback?: string }} [options]
 * @returns {string} une URL sûre, ou `fallback` (défaut '#') si absente/dangereuse.
 */
export function safeUrl(raw, { fallback = '#' } = {}) {
  if (typeof raw !== 'string') return fallback

  const cleaned = stripControlChars(raw).trim()
  if (cleaned === '') return fallback

  let parsed
  try {
    // Base fournie pour que les URLs relatives ("/x", "//host") s'analysent sans
    // exception ; en navigateur on résout sur l'origine courante.
    const base =
      (typeof window !== 'undefined' && window.location && window.location.origin) ||
      'http://localhost'
    parsed = new URL(cleaned, base)
  } catch {
    return fallback
  }

  if (!SAFE_SCHEMES.includes(parsed.protocol)) return fallback
  return parsed.href
}

export { SAFE_SCHEMES, stripControlChars }
