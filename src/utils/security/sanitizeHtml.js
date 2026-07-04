/**
 * Assainissement HTML (sécurité #XSS stocké) — pour tout contenu enrichi
 * utilisateur rendu via `v-html` (chapitres texte/word, aperçu éditeur TipTap).
 *
 * Le contenu de leçon est saisi par des enseignants puis stocké côté backend et
 * renvoyé tel quel. Sans assainissement, `v-html="chapter.content"` exécute
 * `<script>`, `<img onerror>`, `<a href="javascript:">`, etc. → XSS stocké, vol
 * du token en sessionStorage, prise de contrôle de compte.
 *
 * Stratégie : allowlist STRICTE de balises/attributs (le sous-ensemble produit
 * par l'éditeur TipTap du projet), URLs limitées à http(s)/mailto/tel/ancre, et
 * forçage de `rel="noopener noreferrer"` sur les liens `target="_blank"`
 * (anti reverse-tabnabbing). Défaut fail-secure : entrée non-string -> ''.
 *
 * DOMPurify neutralise nativement les gestionnaires `on*`, `javascript:`, les
 * mutations SVG/MathML et le « mutation XSS ». On ajoute l'allowlist explicite
 * (principe du moindre privilège) plutôt que de dépendre des seuls défauts.
 */
import DOMPurify from 'dompurify'
import { stripControlChars } from './safeUrl'

/** Balises autorisées : formatage riche produit par TipTap (starter-kit + ext). */
const ALLOWED_TAGS = Object.freeze([
  'p', 'br', 'hr', 'span', 'div',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'sub', 'sup', 'small',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
])

/** Attributs autorisés (URLs filtrées séparément par ALLOWED_URI_REGEXP). */
const ALLOWED_ATTR = Object.freeze([
  'href', 'src', 'alt', 'title',
  'colspan', 'rowspan',
  'class', 'style',
  'target', 'rel',
])

/**
 * Schémas d'URL autorisés dans href/src. Bloque javascript:, data:, vbscript:…
 * (ancres `#`, chemins relatifs `/` et scheme-relative `//` restent permis).
 */
const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|tel:|[#/])/i

const CONFIG = Object.freeze({
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTR],
  ALLOWED_URI_REGEXP,
  // Ceinture + bretelles : interdits explicites même si absents de l'allowlist.
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'link', 'base'],
  FORBID_ATTR: ['srcset', 'formaction', 'xlink:href', 'ping'],
  ALLOW_DATA_ATTR: false,
})

// Hook global (idempotent) : durcit les liens et impose l'allowlist de schéma
// sur href/src (fail-secure là où DOMPurify tolère data:).
let hookInstalled = false
function installHooks() {
  if (hookInstalled) return
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Politique : tout lien du contenu enrichi s'ouvre dans un onglet isolé, avec
    // un rel sûr forcé quelle que soit l'entrée (DOMPurify retire `target`, on le
    // ré-impose ici de façon déterministe → anti reverse-tabnabbing).
    if (node.nodeName && node.nodeName.toLowerCase() === 'a') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
    // Fail-secure sur href/src : impose l'allowlist de schéma même là où
    // DOMPurify tolère `data:` (ex. <img src="data:text/html,…">). Retire
    // l'attribut si le schéma n'est pas autorisé (anti javascript:/data:).
    for (const attr of ['href', 'src']) {
      if (typeof node.hasAttribute === 'function' && node.hasAttribute(attr)) {
        const value = stripControlChars(node.getAttribute(attr) || '').trim()
        if (!ALLOWED_URI_REGEXP.test(value)) node.removeAttribute(attr)
      }
    }
  })
  hookInstalled = true
}

/**
 * Assainit un fragment HTML utilisateur selon l'allowlist stricte du projet.
 * @param {unknown} dirty  HTML potentiellement malveillant.
 * @returns {string} HTML sûr (chaîne vide si entrée invalide/vide).
 */
export function sanitizeHtml(dirty) {
  if (typeof dirty !== 'string' || dirty === '') return ''
  installHooks()
  return DOMPurify.sanitize(dirty, CONFIG)
}

export { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP }
