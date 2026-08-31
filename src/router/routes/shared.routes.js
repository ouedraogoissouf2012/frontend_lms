import { lessonRoutes } from './lessons.routes'
import { forumRoutes } from './forum.routes'
import { evaluationRoutes } from './evaluation.routes'
import { academicRoutes } from './academic.routes'

// Routes transverses (#H12) — leçons, forum, évaluations, matières,
// classes, séances, présences et coordinateur.
// (Module quiz hérité `/quizzes` supprimé — F2, remplacé par les Évaluations.)
//
// #226 : ce fichier atteignait 280 lignes (limite dure 300, cliquet CI). Les
// définitions sont désormais réparties par domaine (chaque fichier ≤200 lignes).
// L'ORDRE de concaténation ci-dessous est STRICTEMENT identique à l'ancien
// tableau monolithique → résolution vue-router inchangée, mêmes chemins, mêmes
// `meta` (verrouillé par tests/unit/routerRoutes.test.js). Le catch-all 404 reste
// concaténé EN DERNIER dans router/index.js (fallbackRoutes), hors de ce tableau.
//
// Reliquat #12 : chaque `meta.roles` reste justifié par un point d'entrée réel,
// cité en commentaire dans le fichier de domaine correspondant. Cf. ./roleGroups.js
// pour la sémantique des deux groupes (AUTHENTICATED_ROLES / STAFF_ROLES).
export const sharedRoutes = [
  ...lessonRoutes,
  ...forumRoutes,
  ...evaluationRoutes,
  ...academicRoutes,
]
