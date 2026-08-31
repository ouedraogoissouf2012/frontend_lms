/**
 * Formatters centralisés (#23) — fonctions PURES, déterministes, sans état.
 *
 * Source unique de formatage (dates, heure, durées, initiales, troncature) qui
 * remplace les dizaines de redéfinitions locales (DRY, PRODUCTION_STANDARDS Q5).
 * AUCUN import Vue (pas de ref/reactive/computed) : ce sont des utilitaires purs,
 * pas un composable (paradigme Vue — la logique stateful vit dans un composable).
 *
 * Repli fail-safe : valeur nulle/invalide → `'—'` (surchargeable via `{ fallback }`)
 * pour préserver les replis spécifiques des sites migrés ; jamais `'Invalid Date'`/`'NaN'`.
 */

const DEFAULT_FALLBACK = '—'

/** Convertit une valeur (Date|string|number) en Date valide, ou null. */
function toDate(value) {
  if (value == null || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function fallbackOf(opts) {
  return opts?.fallback ?? DEFAULT_FALLBACK
}

function localeDate(value, opts, intlOptions) {
  const d = toDate(value)
  if (!d) return fallbackOf(opts)
  return d.toLocaleDateString('fr-FR', intlOptions)
}

/** JJ/MM/AAAA (fr-FR). */
export function formatDate(value, opts) {
  return localeDate(value, opts, undefined)
}

/** JJ/MM/AAAA HH:mm (composé pour un rendu déterministe, sans séparateur ICU variable). */
export function formatDateTime(value, opts) {
  const d = toDate(value)
  if (!d) return fallbackOf(opts)
  return `${formatDate(d)} ${formatTime(d)}`
}

/** 15 juin 2026. */
export function formatDateLong(value, opts) {
  return localeDate(value, opts, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** lundi 15 juin 2026. */
export function formatDateWeekday(value, opts) {
  return localeDate(value, opts, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Date courte (2-digit/short/numeric). */
export function formatDateShort(value, opts) {
  return localeDate(value, opts, { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Heure du jour HH:mm. */
export function formatTime(value, opts) {
  const d = toDate(value)
  if (!d) return fallbackOf(opts)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * YYYY-MM-DD en heure LOCALE (getters locaux, PAS toISOString qui décale le jour
 * près de minuit).
 * @returns {string} '' si la date est invalide.
 */
export function formatDateInput(value) {
  const d = toDate(value)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Durée en minutes → « Xh Ymin » / « Xh » / « Ymin ». 0/null/NaN → repli. */
export function formatDuration(minutes, opts) {
  const n = Number(minutes)
  if (minutes == null || Number.isNaN(n) || n <= 0) return fallbackOf(opts)
  const total = Math.floor(n)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`
  return `${m}min`
}

/** Durée écoulée en secondes → « m:ss » (minuteurs). Négatif/NaN → '0:00'. */
export function formatElapsed(seconds) {
  const s = Number(seconds)
  if (Number.isNaN(s) || s < 0) return '0:00'
  const total = Math.floor(s)
  const m = Math.floor(total / 60)
  const sec = total % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

/**
 * Compteur MESURÉ (nombre fini) → sa valeur ; NON MESURÉ → repli « — ».
 *
 * `{{ x || 0 }}` affichait `0` aussi bien pour un vrai zéro que pour une donnée
 * jamais chargée (une panne se lisait « 0 étudiant »). Seule une valeur numérique
 * effective (nombre fini, ou chaîne numérique d'un payload API) produit un nombre ;
 * le suffixe éventuel n'est appliqué qu'à une valeur mesurée.
 *
 * @param {*} value Valeur brute (nombre, chaîne numérique, null/undefined…).
 * @param {{ fallback?: string, suffix?: string }} [opts]
 * @returns {string}
 */
export function formatCount(value, { fallback = '—', suffix = '' } = {}) {
  let n = value
  if (typeof value === 'string') {
    if (value.trim() === '') return fallback
    n = Number(value)
  }
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return `${n}${suffix}`
}

/**
 * Initiales (max 2 lettres, majuscules) — polymorphe :
 * chaîne `'Jean Dupont'`, objet `{prenom, nom}` ou `{name}`. Vide → '?'.
 */
export function getInitials(input) {
  if (!input) return '?'
  if (typeof input === 'object') {
    if (input.prenom || input.nom) {
      const a = String(input.prenom || '').trim()[0] || ''
      const b = String(input.nom || '').trim()[0] || ''
      return (a + b).toUpperCase() || '?'
    }
    if (input.name) return getInitials(input.name)
    return '?'
  }
  const name = String(input).trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

/**
 * Nom affichable d'un utilisateur, tolérant aux DEUX formes de payload.
 *
 * Le backend renvoie un unique champ `name` au login, tandis que plusieurs
 * gabarits composaient `{{ user.nom }} {{ user.prenom }}` : les deux champs
 * étant absents, l'écran n'affichait qu'un espace. `name` prime, les champs
 * séparés servent de repli, et un seul des deux suffit (pas d'espace parasite).
 *
 * @param {{name?: string, prenom?: string, nom?: string}|null|undefined} user
 * @param {{fallback?: string}} [opts] - Repli quand aucun nom n'est disponible ('' par défaut).
 * @returns {string}
 */
export function getFullName(user, opts) {
  const fallback = opts?.fallback ?? ''
  if (!user || typeof user !== 'object') return fallback

  // `nom_complet` est la forme renvoyée par KLASSCI dans le roster d'une classe
  // (`/lms/classes/{id}` → data.etudiants), aux côtés de matricule et email.
  const direct = String(user.name ?? user.nom_complet ?? '').trim()
  if (direct) return direct

  const composed = [user.prenom, user.nom]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ')

  return composed || fallback
}

/** Tronque `text` à `maxLength` caractères et ajoute une ellipse. Vide → ''. */
export function truncate(text, maxLength) {
  if (!text) return ''
  const s = String(text)
  return s.length > maxLength ? `${s.slice(0, maxLength)}…` : s
}

/** Alias de `truncate` (compat sites migrés). */
export { truncate as truncateText }

