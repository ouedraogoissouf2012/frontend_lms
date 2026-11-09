import { klassciService } from '@/services/klassci'
import { analyticsService } from '@/services/analytics'
import { getAdminStatistics, extractAdminStatistics } from '@/services/adminStatistics'
import { readCache, writeCache } from '@/services/cache'
import { logError, normalizeError } from '@/services/errorHandler'
import { deriveInstitutionCounters } from '@/utils/classStats'

/**
 * Nombre fini, ou `null` si la valeur n'a pas été MESURÉE.
 *
 * La distinction est le cœur du correctif : afficher `0` pour une métrique dont
 * aucune source n'a été chargée présente une absence de mesure comme une mesure
 * nulle — l'utilisateur lit « il n'y a rien » là où il faut lire « on ne sait pas ».
 */
const measured = (value) => (Number.isFinite(value) ? value : null)

/**
 * Couche chargement de données d'AdminDashboard (#H3 ≤300) : récupère les données
 * KLASSCI (classes/matières/enseignants + stats dérivées) avec cache et lecture
 * immédiate, les analytics (tendances, tâches en attente, utilisateurs récents) et
 * les événements du calendrier (séances à venir mappées en événements colorés).
 *
 * Reçoit les refs partagées de useAdminDashboard pour centraliser l'état. Logique
 * extraite verbatim de la vue d'origine pour garantir la parité de comportement.
 */
export function useAdminDashboardData({
  stats, classes, matieres, activityData, pendingTasks, recentUsers, calendarEvents, loading, loadError,
  analyticsError, calendarState, calendarError,
}) {
  async function loadKlassciData() {
    loading.value.classes = true
    loading.value.matieres = true
    loading.value.stats = true
    loadError.value = null

    // Lire les caches existants
    const classesCached = readCache('admin_klassci_classes')
    const matieresCached = readCache('admin_klassci_matieres')

    // Afficher immédiatement ce qui est en cache
    if (classesCached) { classes.value = classesCached; loading.value.classes = false }
    if (matieresCached) { matieres.value = matieresCached; loading.value.matieres = false }

    // Lancer en parallèle uniquement ce qui est nécessaire
    const needClasses = !classesCached
    const needMatieres = !matieresCached

    try {
      // Sources INDÉPENDANTES : un refus n'efface plus les compteurs des autres (un
      // seul échec vidait tout l'écran). Une source refusée vaut `null`, donc ses
      // compteurs restent « — » ; une source servie par le cache n'est pas redemandée.
      const echecs = []
      const lire = (resultat, source) => {
        if (resultat.status === 'fulfilled') return resultat.value
        logError(resultat.reason, `[useAdminDashboardData] ${source}`)
        echecs.push(resultat.reason)
        return null
      }
      const [rClasses, rMatieres, rEnseignants, rAdminStats] = await Promise.allSettled([
        needClasses  ? klassciService.getClasses()     : Promise.resolve(classesCached),
        needMatieres ? klassciService.getMatieres()    : Promise.resolve(matieresCached),
        klassciService.getEnseignants(),
        getAdminStatistics(),
      ])
      const classesData = lire(rClasses, 'classes')
      const matieresData = lire(rMatieres, 'matières')
      const enseignants = lire(rEnseignants, 'enseignants')
      // Les statistiques admin restent en tolérance de panne silencieuse, comme avant.
      const adminStatsPayload = rAdminStats.status === 'fulfilled' ? rAdminStats.value : null
      if (rAdminStats.status === 'rejected') logError(rAdminStats.reason, '[useAdminDashboardData] GET /admin/statistics')

      if (needClasses) {
        classes.value = classesData ?? []
        if (classesData) writeCache('admin_klassci_classes', classesData)
      }
      if (needMatieres) {
        matieres.value = matieresData ?? []
        if (matieresData) writeCache('admin_klassci_matieres', matieresData)
      }

      // Les métriques système portent le total d'évaluations. Chargées ici (et non
      // dans loadAnalytics) pour que les stats soient publiées d'un seul bloc, et
      // en tolérance de panne : leur échec ne doit pas priver le tableau de bord
      // des compteurs KLASSCI, qui eux sont déjà en main.
      const metrics = await analyticsService.getSystemMetrics().catch((err) => {
        logError(err, '[useAdminDashboardData] métriques système')
        return null
      })

      stats.value = {
        // Dérivation PARTAGÉE (utils/classStats) avec l'écran Statistiques et le
        // profil. `nb_filieres`/`nb_niveaux` étaient auparavant lus depuis
        // `stats.value` — l'objet même que cette affectation remplace, et qu'aucune
        // source ne peuplait : les deux compteurs étaient figés à 0 pour toujours.
        ...deriveInstitutionCounters({
          // `null` pour une source refusée : non mesurée. Une source servie par le
          // cache arrive ici telle quelle (Promise.resolve du cache).
          classes: classesData,
          matieres: matieresData,
          enseignants,
        }),
        nb_seances_actives: null,
        nb_evaluations: measured(metrics?.evaluations?.total),
        ...extractAdminStatistics(adminStatsPayload),
      }
      if (echecs.length > 0) {
        loadError.value = echecs[0]?.userMessage ?? normalizeError(echecs[0]).userMessage
      }
    } catch (error) {
      logError(error, '[useAdminDashboardData] chargement KLASSCI')
      if (needClasses) classes.value = []
      if (needMatieres) matieres.value = []
      // Aucun comptage n'a abouti : on marque les compteurs NON MESURÉS (null)
      // plutôt que de laisser l'écran afficher quatre zéros, qui se lisent comme
      // un établissement vide. Et on remonte l'erreur, jusqu'ici totalement muette.
      stats.value = {
        nb_enseignants: null,
        nb_etudiants: null,
        nb_classes_actives: null,
        nb_matieres_actives: null,
        nb_filieres: null,
        nb_niveaux: null,
        nb_seances_actives: null,
        nb_evaluations: null,
      }
      loadError.value = error?.userMessage
        || 'Impossible de charger les données de l’établissement. Les compteurs sont indisponibles.'
    } finally {
      loading.value.classes = false
      loading.value.matieres = false
      loading.value.stats = false
    }
  }

  /**
   * Trois sources INDÉPENDANTES, en parallèle : l'échec de l'une n'empêche plus les
   * autres (elles étaient enchaînées dans un seul `try`). Une part en échec garde sa
   * valeur précédente — `null` au départ, « non mesuré » — et l'échec se DIT.
   */
  async function loadAnalytics() {
    loading.value.analytics = true
    analyticsError.value = ''
    const [trends, tasks, users] = await Promise.allSettled([
      analyticsService.getActivityTrends(),
      analyticsService.getPendingTasks(),
      analyticsService.getRecentUsers(),
    ])
    if (trends.status === 'fulfilled') activityData.value = trends.value
    if (tasks.status === 'fulfilled') pendingTasks.value = tasks.value
    if (users.status === 'fulfilled') recentUsers.value = users.value
    const echec = [trends, tasks, users].find((r) => r.status === 'rejected')
    if (echec) {
      logError(echec.reason, '[useAdminDashboardData] analytics')
      analyticsError.value = echec.reason?.userMessage ?? normalizeError(echec.reason).userMessage
    }
    loading.value.analytics = false
  }

  /**
   * Chargé À LA DEMANDE (bouton), jamais au montage : `/lms/seances/upcoming` a coûté
   * cher en production (#212). L'état est toujours vrai : non chargé, chargement,
   * prêt, ou erreur visible — plus de calendrier vide qui affirmait « aucune séance ».
   */
  async function loadCalendarEvents() {
    calendarState.value = 'chargement'
    calendarError.value = ''
    try {
      // Charger les vraies séances depuis KLASSCI (30 prochains jours)
      const seances = await klassciService.getUpcomingSeances({ days: 30 })

      const events = seances.map(seance => {
        // Déterminer la couleur selon l'état visio
        let backgroundColor = '#6b7280' // gris par défaut
        let title = seance.matiere?.libelle || seance.matiere?.nom || 'Séance'

        if (seance.visio_enabled) {
          if (seance.visio_active) {
            backgroundColor = '#10b981' // vert - visio active
            title = `[VISIO EN COURS] ${title}`
          } else if (seance.visio_status === 'programmee') {
            backgroundColor = '#3b82f6' // bleu - visio programmée
            title = `[VISIO] ${title}`
          } else {
            backgroundColor = '#8b5cf6' // violet - visio activée mais pas encore programmée
            title = `[VISIO ACTIVÉE] ${title}`
          }
        }

        // Parser les dates
        const dateSeance = seance.date_seance
        const heureDebut = seance.heure_debut || '08:00'
        const heureFin = seance.heure_fin || '10:00'

        const start = new Date(`${dateSeance}T${heureDebut}:00`)
        const end = new Date(`${dateSeance}T${heureFin}:00`)

        return {
          id: `seance-${seance.id}`,
          title: `${title} - ${seance.classe?.libelle || seance.classe?.nom || 'N/A'}`,
          start: start.toISOString(),
          end: end.toISOString(),
          backgroundColor,
          borderColor: backgroundColor,
          extendedProps: {
            type: 'seance',
            seanceId: seance.id,
            classe: seance.classe?.libelle || seance.classe?.nom || 'N/A',
            matiere: seance.matiere?.libelle || seance.matiere?.nom || 'N/A',
            enseignant: seance.enseignant?.nom || 'N/A',
            salle: seance.salle || '',
            visioEnabled: seance.visio_enabled || false,
            visioActive: seance.visio_active || false,
            visioStatus: seance.visio_status || null,
            description: `${seance.matiere?.libelle || 'Séance'} - Salle: ${seance.salle || 'N/A'}`,
            url: '/coordinateur/seances'
          }
        }
      })

      calendarEvents.value = events
      calendarState.value = 'pret'
    } catch (error) {
      // Le reste du tableau de bord reste exploitable ; l'échec du calendrier se DIT.
      logError(error, '[useAdminDashboardData] calendrier')
      calendarEvents.value = []
      calendarError.value = error?.userMessage ?? normalizeError(error).userMessage
      calendarState.value = 'erreur'
    }
  }

  return { loadKlassciData, loadAnalytics, loadCalendarEvents }
}
