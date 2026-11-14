/**
 * Noter une copie (lot CORR) : `POST /evaluations/{id}/submissions/{submission}/grade`, les points des
 * dissertations et un commentaire facultatif. Un envoi à la fois. Chaque refus dit SA cause, jamais le
 * texte du serveur (D0) :
 * - 409 `evaluation_attempt_locked` : le message du catalogue (copie hors délai, C28) ;
 * - 409 sans `reason` : la copie est encore en cours ;
 * - 403 : non autorisé (règle serveur, voir utils/correctionCopies) ;
 * - 422 : rattaché à la question (`points.<id>`), sinon le message de validation ;
 * - le reste : son message, avec « Réessayer » sur une panne passagère.
 *
 * @param {{ evaluation: import('vue').Ref<Object>, onNotee?: Function }} options
 */
import { ref, reactive, computed } from 'vue'
import evaluationService from '@/services/evaluation'
import { messageDe, normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { estPannePassagere } from '@/utils/pannePassagere'
import { questionsANoter, validerPoints } from '@/utils/correctionCopies'

const MESSAGES = Object.freeze({
  enCours: 'Cette copie est encore en cours : elle ne peut pas être notée.',
  interdit: 'Vous ne pouvez pas noter cette copie.',
})

export function useNotationCopie({ evaluation, onNotee }) {
  const copie = ref(null)
  const points = reactive({})
  const feedback = ref('')
  const erreurs = ref({})
  const erreur = ref(null)
  const canRetry = ref(false)
  const envoi = ref(false)
  const dissertations = computed(() => questionsANoter(evaluation.value))

  function ouvrir(cible) {
    copie.value = cible
    for (const cle of Object.keys(points)) delete points[cle]
    for (const q of dissertations.value) points[q.id] = cible?.manual_points?.[q.id] ?? ''
    feedback.value = ''
    erreurs.value = {}
    erreur.value = null
    canRetry.value = false
  }

  function fermer() {
    copie.value = null
  }

  function retenirRefus(err) {
    const statut = err?.response?.status
    const reason = err?.response?.data?.reason
    canRetry.value = false
    if (statut === 409 && !reason) {
      erreur.value = MESSAGES.enCours
    } else if (statut === 403) {
      erreur.value = MESSAGES.interdit
    } else if (statut === 422) {
      const champs = err?.fieldErrors ?? normalizeError(err).fieldErrors ?? {}
      const parQuestion = {}
      for (const cle of Object.keys(champs)) {
        const m = /^points\.(\d+)$/.exec(cle)
        const q = m && dissertations.value.find((d) => String(d.id) === m[1])
        if (q) parQuestion[q.id] = `Indiquez des points entre 0 et ${Number(q.points)}.`
      }
      erreurs.value = parQuestion
      erreur.value = ERROR_MESSAGES.validation
    } else {
      erreur.value = messageDe(err)
      canRetry.value = estPannePassagere(err)
    }
  }

  async function noter() {
    if (envoi.value || !copie.value) return
    erreur.value = null
    canRetry.value = false
    erreurs.value = validerPoints(points, dissertations.value)
    if (Object.keys(erreurs.value).length > 0) return
    const charge = {
      points: Object.fromEntries(dissertations.value.map((q) => [q.id, Number(String(points[q.id]).replace(',', '.'))])),
      feedback: feedback.value.trim() || null,
    }
    envoi.value = true
    try {
      await evaluationService.gradeSubmission(evaluation.value.id, copie.value.id, charge)
      fermer()
      onNotee?.()
    } catch (err) {
      retenirRefus(err)
    } finally {
      envoi.value = false
    }
  }

  return { copie, points, feedback, erreurs, erreur, canRetry, envoi, dissertations, ouvrir, fermer, noter }
}
