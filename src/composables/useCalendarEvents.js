import { ref } from 'vue'
import { cleMatiere } from '@/utils/seances'
import { toId } from '@/utils/toId'
import { idClasse, idEnseignant, idMatiere } from '@/utils/identiteEvaluation'
import { estEtatVide } from '@/services/refusalReasons'
import { messageDe } from '@/services/errorHandler'
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
  const error = ref(null) // #238 : message d'erreur distinct d'un agenda vide
  // Un état vide motivé par le serveur (élève sans classe active) : une information, pas une erreur.
  const information = ref(null)

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
        // Une séance sans classe (école créée depuis le LMS) : la matière seule, pas de « - » orphelin.
        title: [seance.matiere?.nom || seance.matiere_nom || 'Cours', seance.classe?.nom || seance.classe_nom]
          .filter(Boolean).join(' - '),
        start: seance.programmation?.heure_debut || seance.date_seance,
        end: seance.programmation?.heure_fin,
        backgroundColor: determineSeanceColor(seance),
        borderColor: determineSeanceColor(seance),
        extendedProps: {
          eventType: 'seance',
          data: seance,
          // Sans id (séance locale), la clé de nom : options et filtre restent cohérents (cleMatiere).
          matiereId: cleMatiere(seance) ?? seance.klassci_matiere_id,
          classeId: seance.classe?.id || seance.klassci_classe_id,
          enseignantId: seance.enseignant?.id || seance.klassci_enseignant_id,
          isUrgent: false
        }
      }))
    } catch (e) {
      // Seul un motif « état vide » du catalogue (jamais le texte du serveur, D0) rend un agenda vide honnête.
      if (estEtatVide(e?.response?.data?.reason)) {
        information.value = messageDe(e)
        return []
      }
      // #238 : ne pas masquer la panne — l'agenda ne doit pas paraître vide.
      error.value = e?.userMessage || 'Impossible de charger les séances.'
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
            // D72-c (L1) : identité par les champs à plat, les deux familles (une évaluation locale
            // ne disparaît plus dès qu'on filtre).
            matiereId: idMatiere(evaluation),
            classeId: idClasse(evaluation),
            enseignantId: idEnseignant(evaluation),
            isUrgent: isEvaluationUrgent(evaluation)
          }
        }
      })
    } catch (e) {
      // #238 : ne pas masquer la panne — l'agenda ne doit pas paraître vide.
      error.value = e?.userMessage || 'Impossible de charger les évaluations.'
      return []
    }
  }

  /** Options de filtres dérivées des événements chargés (matières/classes/enseignants uniques). */
  function loadFilterOptions() {
    try {
      const allMatieres = new Map()
      const allClasses = new Map()
      const allEnseignants = new Map()

      // D72-c (L2, R7) : une option est clée par la clé MÊME de son événement (séance : `cleMatiere`,
      // `classe.id`, `enseignant.id` ; évaluation : `identiteEvaluation`). Option et filtre ne
      // divergent plus. Une entrée sans nom n'a pas d'option (libellé vide, et tri impossible).
      const ajouter = (map, cle, option) => {
        if (toId(cle) && option.nom && !map.has(toId(cle))) map.set(toId(cle), { id: cle, ...option })
      }
      events.value.forEach((event) => {
        const { data, matiereId, classeId, enseignantId } = event.extendedProps
        ajouter(allMatieres, matiereId, { nom: data.matiere?.nom || data.matiere_nom })
        ajouter(allClasses, classeId, { nom: data.classe?.nom || data.classe_nom })
        ajouter(allEnseignants, enseignantId, {
          nom: data.enseignant?.nom || data.enseignant_nom, prenom: data.enseignant?.prenom || ''
        })
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
    error.value = null // #238 : repart d'un état sain à chaque chargement
    information.value = null
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

  return { events, matieres, classes, enseignants, loading, refreshing, error, information, loadEvents, refreshData }
}
