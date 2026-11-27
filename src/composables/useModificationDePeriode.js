import { reactive, ref } from 'vue'
import { trainingSessionsService } from '@/services/trainingSessions'
import { invalidResponseError, normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Modifier une période (#658, lms_backend#1651) : `PUT /training-sessions/{id}`, le libellé et les CINQ
 * dates d'un bloc (une date vide part `null`). Seules une période en brouillon ou publiée se modifient
 * (`MODIFIABLES`) ; le serveur reste l'autorité (409 `training_session_not_editable`, 422
 * `training_session_published_needs_start`, 422 par champ sur l'ordre des dates).
 *
 * L'écran dit ce que le SERVEUR a enregistré : la période relue (`data`) est rendue, jamais la saisie.
 * Un refus NET (4xx) ne change rien ; sans réponse ou en 5xx, la période affichée devient incertaine.
 */
export const MODIFIABLES = Object.freeze(['brouillon', 'publiee'])

/** Les cinq dates, dans l'ordre chronologique (ADR-711-04), et leur libellé à l'écran. */
export const DATES_DE_PERIODE = Object.freeze([
  ['enrollment_opens_at', 'Ouverture des inscriptions'],
  ['enrollment_closes_at', 'Clôture des inscriptions'],
  ['starts_on', 'Début'],
  ['ends_on', 'Fin'],
  ['certificate_available_at', 'Attestation disponible le'],
])

const CHAMPS = ['libelle', ...DATES_DE_PERIODE.map(([cle]) => cle)]

/**
 * @param {() => object} periode - lecture de la période courante (forme de `TrainingSessionView`)
 * @param {(relue: object) => void} onModifiee - reçoit la période RELUE du serveur
 */
export function useModificationDePeriode(periode, onModifiee) {
  const ouvert = ref(false)
  const champs = reactive(Object.fromEntries(CHAMPS.map((cle) => [cle, ''])))
  const erreursChamps = ref({})
  const erreur = ref('')
  const occupe = ref(false)
  const incertaine = ref(false)

  function ouvrir() {
    for (const cle of CHAMPS) champs[cle] = periode()?.[cle] ?? ''
    erreur.value = ''
    erreursChamps.value = {}
    ouvert.value = true
  }

  function annuler() {
    ouvert.value = false
    erreur.value = ''
    erreursChamps.value = {}
  }

  async function enregistrer() {
    if (occupe.value) return false
    occupe.value = true
    erreur.value = ''
    erreursChamps.value = {}
    try {
      const response = await trainingSessionsService.modifier(periode().id, { ...champs })
      const relue = response?.data
      if (response?.success !== true || relue?.id !== periode().id) throw invalidResponseError('PUT période illisible', response)
      incertaine.value = false
      ouvert.value = false
      onModifiee(relue)
      return true
    } catch (err) {
      const normalisee = normalizeError(err)
      erreur.value = err?.userMessage || normalisee.userMessage || ERROR_MESSAGES.unknown
      erreursChamps.value = normalisee.fieldErrors ?? {}
      const status = err?.response?.status
      if (status == null || status >= 500) incertaine.value = true
      return false
    } finally {
      occupe.value = false
    }
  }

  return { ouvert, champs, erreursChamps, erreur, occupe, incertaine, ouvrir, annuler, enregistrer }
}
