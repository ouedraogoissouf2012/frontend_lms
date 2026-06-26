/**
 * Configuration déclarative UNIQUE de la navigation (#104 / N1).
 *
 * Source de vérité du menu, extraite à l'identique du `menuSections` codé en dur dans
 * `src/components/layout/Sidebar.vue` (lignes 138-344, commit de référence). Objectif :
 * une seule définition réutilisée par la Sidebar (#N2) et la BottomNavigation (#N3),
 * supprimant la duplication (#25) et préparant le passage de Sidebar sous 300 lignes (#28).
 *
 * Ce module ne contient QUE des données pures (aucun Vue, aucun accès auth). Le filtrage
 * par rôle vit dans `@/composables/useNavigation` et réutilise `@/constants/roles` —
 * la logique de rôle n'est jamais réimplémentée ici.
 *
 * --- Fidélité au code source (aucune invention) ---
 * Le `menuSections` original calcule des drapeaux puis empile les items dans un ordre
 * précis avec des conditions (dont des négations `!isCoordinateur` et des `to` variables
 * selon le rôle). On reproduit EXACTEMENT ce comportement en pré-résolvant, pour chaque
 * item, l'ensemble des rôles CANONIQUES auxquels il apparaît :
 *   - isStudentRole  → [etudiant]
 *   - isTeacherRole  → [enseignant, coordinateur]   (isTeacher OU coordinateur)
 *   - isAdminRole    → [admin, coordinateur]         (isAdminScope ; supradmin sort en amont)
 *   - isCoordinateur → [coordinateur]
 *   - isSupradmin    → [supradmin]                   (menu minimal, retour anticipé)
 * Les `to` conditionnels du source (Dashboard, Paramètres) sont fidèlement éclatés en
 * deux entrées disjointes par rôle. L'ordre du tableau ci-dessous est tel que, pour
 * CHAQUE rôle, la sous-séquence filtrée reproduit l'ordre d'empilement d'origine.
 *
 * Le menu source est plat : aucun sous-menu (`children`) n'est défini. Le champ
 * `children` reste documenté et géré par le filtre (récursif) pour les évolutions #N2/#N3,
 * sans en inventer le contenu.
 */

import { ROLES } from '@/constants/roles'

/**
 * @typedef {Object} NavItem
 * @property {string} label    Libellé affiché.
 * @property {string} icon     Classe d'icône Font Awesome (ex. 'fa-home'), reprise telle quelle.
 * @property {string} [to]     Route cible (absente pour un simple groupe de `children`).
 * @property {string[]} roles  Rôles CANONIQUES (cf. `ROLES`) auxquels l'item est visible.
 * @property {NavItem[]} [children] Sous-items optionnels (filtrés récursivement par rôle).
 */

const { ETUDIANT, ENSEIGNANT, COORDINATEUR, ADMIN, SUPRADMIN } = ROLES

/**
 * Menu déclaratif complet, dans l'ordre d'empilement du Sidebar source.
 * @type {ReadonlyArray<NavItem>}
 */
export const NAV_SECTIONS = Object.freeze([
  // --- Bloc Étudiant (isStudentRole) ---
  { icon: 'fa-home', label: 'Dashboard', to: '/student/dashboard', roles: [ETUDIANT] },
  { icon: 'fa-book', label: 'Mes Cours', to: '/student/courses', roles: [ETUDIANT] },
  { icon: 'fa-clock-o', label: 'Emploi du Temps', to: '/student/schedule', roles: [ETUDIANT] },
  { icon: 'fa-edit', label: 'Évaluations', to: '/student/evaluations-list', roles: [ETUDIANT] },
  { icon: 'fa-star', label: 'Mes Notes', to: '/student/grades', roles: [ETUDIANT] },
  { icon: 'fa-comments', label: 'Forum', to: '/forum', roles: [ETUDIANT] },
  { icon: 'fa-cog', label: 'Paramètres', to: '/student/settings', roles: [ETUDIANT] },

  // --- Dashboard enseignant/admin (to conditionnel éclaté) ---
  { icon: 'fa-home', label: 'Dashboard', to: '/teacher/dashboard', roles: [ENSEIGNANT] },
  { icon: 'fa-home', label: 'Dashboard', to: '/admin/dashboard', roles: [COORDINATEUR, ADMIN] },

  // --- Bloc Enseignant (isTeacherRole) ---
  { icon: 'fa-calendar', label: 'Emploi du Temps', to: '/teacher/schedule', roles: [ENSEIGNANT] },
  { icon: 'fa-th-large', label: 'Mon Espace', to: '/teacher/hub', roles: [ENSEIGNANT] },
  { icon: 'fa-edit', label: 'Évaluations', to: '/teacher/evaluations', roles: [ENSEIGNANT] },
  { icon: 'fa-edit', label: 'Évaluations', to: '/coordinateur/evaluations', roles: [COORDINATEUR] },

  // --- Bloc Admin (isAdminRole) ---
  { icon: 'fa-users', label: 'Utilisateurs', to: '/admin/users', roles: [ADMIN] },
  // Coordinateur : hub admin restreint
  { icon: 'fa-building', label: 'Espace Admin', to: '/admin/hub', roles: [COORDINATEUR] },
  { icon: 'fa-trophy', label: 'Résultats', to: '/admin/evaluations/results', roles: [COORDINATEUR] },
  { icon: 'fa-calendar', label: 'Séances & Visio', to: '/coordinateur/seances', roles: [COORDINATEUR] },
  // Admin/superAdmin complet (pas coordinateur)
  { icon: 'fa-building', label: 'Classes', to: '/admin/classes', roles: [ADMIN] },
  { icon: 'fa-book', label: 'Matières', to: '/admin/matieres', roles: [ADMIN] },
  { icon: 'fa-user', label: 'Enseignants', to: '/admin/enseignants', roles: [ADMIN] },
  { icon: 'fa-calendar', label: 'Séances', to: '/admin/seances', roles: [ADMIN] },
  { icon: 'fa-video-camera', label: 'Visioconférences', to: '/admin/visioconferences', roles: [ADMIN] },
  { icon: 'fa-trophy', label: 'Résultats Évaluations', to: '/admin/evaluations/results', roles: [ADMIN] },
  { icon: 'fa-line-chart', label: 'Statistiques', to: '/admin/stats', roles: [ADMIN] },

  // --- Queue partagée enseignant/admin ---
  { icon: 'fa-comments', label: 'Forum', to: '/forum', roles: [ENSEIGNANT, COORDINATEUR, ADMIN] },
  { icon: 'fa-history', label: 'Historique', to: '/attendance/seances', roles: [ENSEIGNANT, COORDINATEUR, ADMIN] },
  { icon: 'fa-cog', label: 'Paramètres', to: '/teacher/settings', roles: [ENSEIGNANT] },
  { icon: 'fa-cog', label: 'Paramètres', to: '/admin/settings', roles: [COORDINATEUR, ADMIN] },

  // --- Supradmin (menu minimal, retour anticipé d'origine) ---
  { icon: 'fa-university', label: 'Institutions', to: '/admin/institutions', roles: [SUPRADMIN] },
])
