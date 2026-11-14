/**
 * Création d'une évaluation dans une école créée depuis le LMS (D72-b). Les créateurs existants partent de
 * la programmation KLASSCI : sans elle, l'enseignant ne pouvait rien créer. ARRÊT 2 validé :
 * - offerte seulement sur un catalogue `source: 'lms_local'` (D172) ; jamais dans une école KLASSCI ;
 * - `classe_id` et `matiere_id` pris sur la MÊME carte ; aucune clé `klassci_*` (D132) ;
 * - date exigée : sans elle, la fenêtre locale reste fermée aux élèves (E2a) ; ISO avec décalage ;
 * - l'évaluation part sans question (`questions: []`) : elles s'ajoutent ensuite depuis sa carte ;
 * - un 422 de champ dit NOS messages (D-a1, D0) ; un refus motivé, son message du catalogue ;
 * - un envoi à la fois.
 *
 * @param {{ matieres: import('vue').Ref<Array> }} options le catalogue chargé par l'écran
 */
import { ref, reactive, computed, watch } from 'vue'
import evaluationService from '@/services/evaluation'
import { messageDe } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { estPannePassagere } from '@/utils/pannePassagere'
import { isoAvecDecalage } from '@/utils/dateLocale'
import { matieresLocales, classesDeLaMatiere } from '@/utils/couplesLocaux'

const MESSAGES = Object.freeze({
  titre: 'Le titre compte de 3 à 255 caractères.',
  date: 'Indiquez la date et l’heure de l’évaluation.',
  duree: 'La durée va de 1 à 1440 minutes.',
  matiere: 'Choisissez la matière.',
  classe: 'Choisissez la classe.',
})
// Un 422 du serveur est rattaché au champ, jamais affiché tel quel (D0).
const CHAMP_DU_SERVEUR = Object.freeze({
  titre: 'titre', date_evaluation: 'date', duree_minutes: 'duree', matiere_id: 'matiere', classe_id: 'classe',
})
const VIDE = Object.freeze({ matiereId: null, classeId: null, titre: '', debut: '', duree_minutes: 60, coefficient: 1, bareme: 20 })

export function useCreationEvaluationLocale({ matieres }) {
  const locales = computed(() => matieresLocales(matieres?.value))
  const disponible = computed(() => locales.value.length > 0)

  const form = reactive({ ...VIDE })
  const classesDisponibles = computed(() => classesDeLaMatiere(locales.value, form.matiereId))
  // Changer de matière retire une classe qui n'est pas au programme de la nouvelle.
  watch(() => form.matiereId, () => {
    if (!classesDisponibles.value.some((c) => c.id === form.classeId)) form.classeId = null
  })

  const erreurs = ref({})
  const erreur = ref(null)
  const canRetry = ref(false)
  const envoi = ref(false)

  function valider() {
    const e = {}
    const titre = form.titre.trim()
    if (titre.length < 3 || titre.length > 255) e.titre = MESSAGES.titre
    if (isoAvecDecalage(form.debut) === null) e.date = MESSAGES.date
    const duree = Number(form.duree_minutes)
    if (!Number.isInteger(duree) || duree < 1 || duree > 1440) e.duree = MESSAGES.duree
    if (!locales.value.some((m) => m.id === form.matiereId)) e.matiere = MESSAGES.matiere
    if (!classesDisponibles.value.some((c) => c.id === form.classeId)) e.classe = MESSAGES.classe
    erreurs.value = e
    return Object.keys(e).length === 0
  }

  function charge() {
    return {
      classe_id: form.classeId,
      matiere_id: form.matiereId,
      titre: form.titre.trim(),
      type: 'qcm',
      date_evaluation: isoAvecDecalage(form.debut),
      duree_minutes: Number(form.duree_minutes),
      coefficient: Number(form.coefficient),
      bareme: Number(form.bareme),
      questions: [],
    }
  }

  function reinitialiser() {
    Object.assign(form, VIDE)
    erreurs.value = {}
    erreur.value = null
    canRetry.value = false
  }

  function retenirRefus(err) {
    const champs = {}
    for (const cle of Object.keys(err?.fieldErrors ?? {})) {
      const champ = CHAMP_DU_SERVEUR[cle]
      if (champ) champs[champ] = MESSAGES[champ]
    }
    erreurs.value = champs
    erreur.value = err?.fieldErrors ? ERROR_MESSAGES.validation : messageDe(err)
    canRetry.value = estPannePassagere(err)
  }

  /** @returns {Promise<Object|null>} l'évaluation créée, ou null (invalide, refusée, envoi en cours). */
  async function creer() {
    if (envoi.value) return null
    erreur.value = null
    canRetry.value = false
    if (!valider()) return null
    envoi.value = true
    try {
      const reponse = await evaluationService.createEvaluation(charge())
      reinitialiser()
      return reponse.data
    } catch (err) {
      retenirRefus(err)
      return null
    } finally {
      envoi.value = false
    }
  }

  return {
    disponible, matieresLocales: locales, classesDisponibles, form, erreurs, erreur, canRetry, envoi,
    creer, reinitialiser,
  }
}
