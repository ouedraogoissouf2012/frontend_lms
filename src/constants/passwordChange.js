/**
 * Changement de mot de passe — INDISPONIBLE depuis le LMS (dette tracée).
 *
 * Constat vérifié sur le backend jumeau (`lms-backend/routes/api.php` et les
 * fichiers de `routes/api/`) : il n'existe À CE JOUR AUCUN endpoint de
 * changement de mot de passe. KLASSCI étant l'autorité des identités, cette
 * opération lui revient très probablement.
 *
 * Tant que c'est le cas, les écrans de réglages ne doivent RIEN promettre :
 * aucune requête réseau, et surtout AUCUN message de succès. Un utilisateur qui
 * croit avoir remplacé un mot de passe compromis alors qu'il ne l'a pas fait,
 * c'est un problème de sécurité réel, pas un détail d'ergonomie.
 *
 * REMPLACER ICI le jour où l'API existe : brancher l'appel réel dans les
 * `submitPasswordChange` (`useAdminSettings`, `useTeacherSettings`) et dans
 * `components/student/SettingsPasswordModal.vue`, réactiver les champs et le
 * bouton, puis supprimer ce module et `PasswordChangeUnavailableNotice.vue`.
 *
 * L'arbitrage produit (retirer complètement l'écran vs rediriger vers KLASSCI)
 * reste ouvert : cette version se contente de cesser de mentir.
 */

/** Message affiché à l'utilisateur (bannière de la modale + notification). */
export const PASSWORD_CHANGE_UNAVAILABLE_MESSAGE =
  'Le changement de mot de passe n’est pas encore disponible depuis le LMS. ' +
  'Contactez l’administration de votre établissement pour modifier votre ' +
  'mot de passe.'
