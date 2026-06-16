/**
 * Clés de stockage centralisées (#24) — hors clés d'authentification.
 *
 * Les clés d'auth (token/user/meta/institution) sont encapsulées dans le store
 * `src/stores/auth.js` (objet KEYS) — NE PAS les dupliquer ici. Ce module couvre
 * les préférences UI, le thème, la sidebar et la participation visio.
 *
 * Helpers scopés par institution (multi-tenant) : `'default'` n'est appliqué que
 * si l'appelant ne fournit pas de slug (la résolution du slug reste à sa charge).
 */

export const STORAGE_KEYS = Object.freeze({
  ADMIN_PREFERENCES: 'adminPreferences',
  TEACHER_PREFERENCES: 'teacherPreferences',
  USER_PREFERENCES: 'userPreferences',
})

export const VISIO_PARTICIPATION_PREFIX = 'visio_participation_'

/** Clé de préférence de thème, scopée par institution (multi-tenant). */
export function themeKey(slug) {
  return `lms-theme-preference-${slug || 'default'}`
}

/** Clé d'état replié de la sidebar, scopée par institution. */
export function sidebarKey(slug) {
  return `sidebar-collapsed-${slug || 'default'}`
}

/** Clé de participation visio d'un (utilisateur, séance). */
export function visioParticipationKey(seanceId, userId) {
  return `${VISIO_PARTICIPATION_PREFIX}${seanceId}_${userId}`
}
