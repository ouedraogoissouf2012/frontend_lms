import { klassciService } from '@/services/klassci'
import { analyticsService } from '@/services/analytics'
import { readCache, writeCache } from '@/services/cache'
import { logError } from '@/services/errorHandler'
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
      const [classesData, matieresData, enseignants] = await Promise.all([
        needClasses  ? klassciService.getClasses()     : Promise.resolve(classesCached),
        needMatieres ? klassciService.getMatieres()    : Promise.resolve(matieresCached),
        klassciService.getEnseignants()
      ])

      if (needClasses) {
        classes.value = classesData
        writeCache('admin_klassci_classes', classesData)
      }
      if (needMatieres) {
        matieres.value = matieresData
        writeCache('admin_klassci_matieres', matieresData)
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
          classes: classes.value,
          matieres: matieres.value,
          enseignants,
        }),
        // Aucune source n'est chargée pour les séances actives : /lms/seances/upcoming
        // est délibérément écarté du montage (coûteux, cf. useAdminDashboard).
        // DETTE TRACÉE : à alimenter le jour où une métrique dédiée existe.
        // `null` = non mesuré → l'UI affiche « — », pas un 0 fabriqué.
        nb_seances_actives: null,
        nb_evaluations: measured(metrics?.evaluations?.total),
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

  async function loadAnalytics() {
    loading.value.analytics = true
    try {
      // Charger les tendances d'activité
      const trends = await analyticsService.getActivityTrends()
      activityData.value = trends

      // Charger les tâches en attente
      const tasks = await analyticsService.getPendingTasks()
      pendingTasks.value = tasks

      // Charger les utilisateurs récents
      const users = await analyticsService.getRecentUsers()
      recentUsers.value = users

    } catch (error) {
      console.error('Erreur chargement analytics:', error)
    } finally {
      loading.value.analytics = false
    }
  }

  async function loadCalendarEvents() {
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
    } catch (error) {
      // En cas d'erreur backend/proxy, le tableau de bord reste exploitable :
      // l'intercepteur API journalise déjà l'échec, on évite un doublon ici.
      calendarEvents.value = []
    }
  }

  return { loadKlassciData, loadAnalytics, loadCalendarEvents }
}
