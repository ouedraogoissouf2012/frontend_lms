import { klassciService } from '@/services/klassci'
import { analyticsService } from '@/services/analytics'
import { readCache, writeCache } from '@/services/cache'

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
  stats, classes, matieres, activityData, pendingTasks, recentUsers, calendarEvents, loading,
}) {
  async function loadKlassciData() {
    loading.value.classes = true
    loading.value.matieres = true
    loading.value.stats = true

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

      const nbEtudiants = (classes.value || []).reduce((sum, c) => sum + (c.places_occupees || 0), 0)
      stats.value = {
        nb_enseignants: enseignants?.length || 0,
        nb_etudiants: nbEtudiants,
        nb_classes_actives: classes.value?.length || 0,
        nb_matieres_actives: matieres.value?.length || 0,
        nb_filieres: stats.value?.nb_filieres || 0,
        nb_niveaux: stats.value?.nb_niveaux || 0,
        nb_seances_actives: stats.value?.nb_seances_actives || 0,
        nb_evaluations: stats.value?.nb_evaluations || 0
      }
    } catch (error) {
      console.error('❌ Erreur chargement données KLASSCI:', error)
      if (needClasses) classes.value = []
      if (needMatieres) matieres.value = []
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
      console.error('❌ Erreur chargement événements calendrier:', error)
      // En cas d'erreur, laisser le calendrier vide
      calendarEvents.value = []
    }
  }

  return { loadKlassciData, loadAnalytics, loadCalendarEvents }
}
