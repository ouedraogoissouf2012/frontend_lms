import { ref } from 'vue'
import { lmsService } from '@/services/lms'
import evaluationService from '@/services/evaluation'
import {
  determineSeanceColor,
  determineEvaluationColor,
  isEvaluationUrgent,
  getDateRangeStart,
  getDateRangeEnd
} from '@/utils/calendar'

/**
 * Composable de données du calendrier unifié (#28bis — décomposition
 * UniversalCalendar.vue, pour ramener son script sous 300 lignes).
 *
 * Encapsule l'état (events + listes de filtres + loading/refreshing) et le
 * chargement (séances + évaluations selon le rôle, options de filtres dérivées,
 * rafraîchissement KLASSCI). Les couleurs/urgence/bornes viennent de
 * `@/utils/calendar` (logique pure testée).
 *
 * @param {Object} ctx
 * @param {() => string} ctx.getUserRole
 * @param {() => (number|null)} ctx.getUserId
 * @param {import('vue').Ref<string>} ctx.eventTypeFilter
 * @param {import('vue').Ref<string>} ctx.dateRangePreset
 */
export function useCalendarEvents({ getUserRole, getUserId, eventTypeFilter, dateRangePreset }) {
  const events = ref([])
  const matieres = ref([])
  const classes = ref([])
  const enseignants = ref([])
  const loading = ref(true)
  const refreshing = ref(false)

  async function loadSeances(forceRefresh = false) {
    try {
      let response
      switch (getUserRole()) {
        case 'student':
          response = await lmsService.getMyClassesSeances(forceRefresh)
          break
        case 'teacher':
          response = await lmsService.getMyTeachingSeances(forceRefresh)
          break
        case 'coordinator':
        case 'admin':
          response = await lmsService.getUpcomingSeances({
            date_debut: getDateRangeStart(dateRangePreset.value),
            date_fin: getDateRangeEnd(dateRangePreset.value),
            refresh: forceRefresh
          })
          break
      }

      const seances = Array.isArray(response?.data) ? response.data
        : Array.isArray(response) ? response : []

      return seances.map((seance) => ({
        id: `seance-${seance.id}`,
        title: `${seance.matiere?.nom || seance.matiere_nom || 'Cours'} - ${seance.classe?.nom || seance.classe_nom || ''}`,
        start: seance.programmation?.heure_debut || seance.date_seance,
        end: seance.programmation?.heure_fin,
        backgroundColor: determineSeanceColor(seance),
        borderColor: determineSeanceColor(seance),
        extendedProps: {
          eventType: 'seance',
          data: seance,
          matiereId: seance.matiere?.id || seance.klassci_matiere_id,
          classeId: seance.classe?.id || seance.klassci_classe_id,
          enseignantId: seance.enseignant?.id || seance.klassci_enseignant_id,
          isUrgent: false
        }
      }))
    } catch {
      return []
    }
  }

  async function loadEvaluations() {
    try {
      let response
      switch (getUserRole()) {
        case 'student':
          if (getUserId()) {
            // #17 Ék-6 : évals de l'étudiant connecté (identité dérivée du token, anti-IDOR)
            response = await evaluationService.getStudentEvaluations()
          }
          break
        case 'teacher':
        case 'coordinator':
        case 'admin':
          response = await evaluationService.getEvaluations({
            date_debut: getDateRangeStart(dateRangePreset.value),
            date_fin: getDateRangeEnd(dateRangePreset.value)
          })
          break
      }

      const evaluations = Array.isArray(response?.data) ? response.data
        : Array.isArray(response) ? response : []

      return evaluations.map((evaluation) => {
        const startDateStr = evaluation.programmation?.date_evaluation || evaluation.date_evaluation
        const startDate = startDateStr ? new Date(startDateStr) : null
        const endDate = startDate && !isNaN(startDate.getTime())
          ? new Date(startDate.getTime() + (evaluation.duree_minutes || 60) * 60000)
          : null

        return {
          id: `eval-${evaluation.id}`,
          title: evaluation.titre,
          start: startDate,
          end: endDate,
          backgroundColor: determineEvaluationColor(evaluation),
          borderColor: determineEvaluationColor(evaluation),
          extendedProps: {
            eventType: 'evaluation',
            data: evaluation,
            matiereId: evaluation.klassci_matiere_id,
            classeId: evaluation.klassci_classe_id,
            enseignantId: evaluation.klassci_enseignant_id,
            isUrgent: isEvaluationUrgent(evaluation)
          }
        }
      })
    } catch {
      return []
    }
  }

  /** Options de filtres dérivées des événements chargés (matières/classes/enseignants uniques). */
  function loadFilterOptions() {
    try {
      const allMatieres = new Map()
      const allClasses = new Map()
      const allEnseignants = new Map()

      events.value.forEach((event) => {
        const data = event.extendedProps.data
        if (data.matiere?.id) {
          allMatieres.set(data.matiere.id, { id: data.matiere.id, nom: data.matiere.nom })
        } else if (data.matiere_nom) {
          allMatieres.set(data.klassci_matiere_id, { id: data.klassci_matiere_id, nom: data.matiere_nom })
        }
        if (data.classe?.id) {
          allClasses.set(data.classe.id, { id: data.classe.id, nom: data.classe.nom })
        } else if (data.classe_nom) {
          allClasses.set(data.klassci_classe_id, { id: data.klassci_classe_id, nom: data.classe_nom })
        }
        if (data.enseignant?.id) {
          allEnseignants.set(data.enseignant.id, { id: data.enseignant.id, nom: data.enseignant.nom, prenom: data.enseignant.prenom || '' })
        } else if (data.enseignant_nom) {
          allEnseignants.set(data.klassci_enseignant_id, { id: data.klassci_enseignant_id, nom: data.enseignant_nom, prenom: '' })
        }
      })

      matieres.value = Array.from(allMatieres.values()).sort((a, b) => a.nom.localeCompare(b.nom))
      classes.value = Array.from(allClasses.values()).sort((a, b) => a.nom.localeCompare(b.nom))
      enseignants.value = Array.from(allEnseignants.values()).sort((a, b) => a.nom.localeCompare(b.nom))
    } catch (error) {
      console.error('Erreur chargement options de filtres:', error)
    }
  }

  async function loadEvents(forceRefresh = false) {
    loading.value = true
    try {
      const allEvents = []
      if (eventTypeFilter.value !== 'evaluations') {
        allEvents.push(...await loadSeances(forceRefresh))
      }
      if (eventTypeFilter.value !== 'seances') {
        allEvents.push(...await loadEvaluations())
      }
      events.value = allEvents
      loadFilterOptions()
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error)
    } finally {
      loading.value = false
    }
  }

  /** Recharge en forçant le bypass cache KLASSCI. */
  async function refreshData() {
    refreshing.value = true
    try {
      await loadEvents(true)
    } catch (error) {
      console.error('Erreur lors du rafraichissement:', error)
    } finally {
      refreshing.value = false
    }
  }

  return { events, matieres, classes, enseignants, loading, refreshing, loadEvents, refreshData }
}
