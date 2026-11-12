/**
 * Noms de cache partagés par plusieurs composables : une seule constante, jamais une chaîne recopiée.
 *
 * Une clé est VERSIONNÉE quand la FORME de ce qu'elle garde change : une entrée de l'ancienne forme
 * n'est alors jamais relue, l'API l'est (elle expire d'elle-même, ou au logout via `clearAllCache`).
 */

/**
 * Matières de l'enseignant (`/proxy/matieres`, `fetchTeacherMatieres`), lues par ses écrans
 * Séances, Leçons et Évaluations.
 *
 * v2 : depuis B-source, chaque carte d'une école créée depuis le LMS porte `source: 'lms_local'`.
 * Le bouton « Nouvelle séance » en dépend (D3). Une entrée d'avant, sans `source`, le cacherait
 * pendant toute la vie du cache.
 */
export const TEACHER_MATIERES_CACHE = 'teacher_matieres_v2'
