/**
 * Rapports PDF globaux, générés de façon ASYNCHRONE (D10, spec #991).
 *
 * ## Rythme du suivi : sous le seuil MESURÉ du serveur
 *
 * Seuils lus dans le code de lms (`routes/api/admin.php`), par utilisateur :
 *   · suivi `GET /admin/reports/async/{id}` : `throttle:60,1` (l.66-68) ;
 *   · téléchargement : `throttle:30,1` (l.70-72) ;
 *   · demandes `POST /admin/reports/*` : `throttle:30,1` (l.54-64).
 * 2 s (30 requêtes par minute), puis 5 s (12 par minute) : sous les 60 du suivi.
 * Un 429 n'est pas un échec : on attend `Retry-After`, sinon le palier lent.
 *
 * ## Abandon : NON MESURÉ
 *
 * Aucune durée de génération n'a été mesurée sur des données réelles (la seule
 * capture tourne sur une base de test presque vide). Les 5 minutes ci-dessous sont
 * un choix d'écran, à recaler sur une mesure en recette ; le rapport, lui, reste
 * disponible 24 h côté serveur.
 */
export const REPORT_POLL = Object.freeze({
  FAST_MS: 2000,
  FAST_TRIES: 10,
  SLOW_MS: 5000,
  GIVE_UP_MS: 5 * 60 * 1000,
})

/** Statuts de `RapportSuivi`. */
export const REPORT_STATUS = Object.freeze({
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
})

/** Valeurs de `activity_type` acceptées par `RapportActiviteInput`. */
export const ACTIVITY_TYPES = Object.freeze([
  { value: 'all', label: 'Toutes les activités' },
  { value: 'login', label: 'Connexions' },
  { value: 'logout', label: 'Déconnexions' },
  { value: 'content_view', label: 'Consultations de contenu' },
  { value: 'submission', label: 'Remises de travaux' },
  { value: 'grading', label: 'Corrections' },
])

/**
 * Les SEULS filtres que chaque route accepte (spec #991). Le contrôleur ne garde
 * que `validated()` : un champ hors de cette liste était silencieusement ignoré.
 * `classe_id` n'y figure pas : le seul catalogue disponible donne des ids KLASSCI,
 * là où le serveur attend des ids LOCAUX (D41).
 */
const FILTRES_ACCEPTES = Object.freeze({
  attendance: ['date_start', 'date_end'],
  grades: ['date_start', 'date_end'],
  activity: ['date_start', 'date_end', 'activity_type'],
})

/**
 * Filtres à envoyer pour un type : uniquement ses champs acceptés et renseignés.
 * Une valeur restée dans le formulaire après un changement de type n'est pas envoyée.
 * @param {string} type
 * @param {Record<string, string>} formulaire
 */
export function filtresDuRapport(type, formulaire) {
  const filtres = {}
  for (const champ of FILTRES_ACCEPTES[type] ?? []) {
    if (formulaire[champ]) filtres[champ] = formulaire[champ]
  }
  return filtres
}
