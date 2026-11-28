import { ref, computed, watch } from 'vue'
import evaluationService from '@/services/evaluation'
import { useConfirm } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import { displayMessage } from '@/services/displayMessage'

/**
 * front#693 : la diffusion d'une évaluation par son enseignant (contrat back #1773).
 *
 * - Publier ou retirer la publication des notes : une confirmation d'abord ; annulée, rien ne part.
 * - L'ouverture du corrigé : le mode, et la date SEULEMENT pour `at_date` (le serveur refuse une date
 *   pour un autre mode).
 * - La réponse du serveur est l'évaluation à jour : elle est remontée par `onMaj`, jamais devinée.
 *
 * @param {import('vue').Ref<object>} evaluation l'évaluation affichée
 * @param {(evaluation: object) => void} onMaj
 */
export function useDiffusionEvaluation(evaluation, onMaj) {
  const enCours = ref(false)
  const mode = ref('with_results')
  const date = ref('')

  watch(evaluation, (e) => {
    mode.value = e?.correction_release ?? 'with_results'
    date.value = e?.correction_release_at ? versSaisie(e.correction_release_at) : ''
  }, { immediate: true })

  const notesPubliees = computed(() => evaluation.value?.show_results === true)
  const enregistrable = computed(() => !enCours.value && (mode.value !== 'at_date' || date.value !== ''))

  async function basculerNotes() {
    const publier = !notesPubliees.value
    const ok = await useConfirm().confirm({
      title: publier ? 'Publier les notes' : 'Retirer la publication',
      message: publier
        ? 'Les élèves verront leur note et le commentaire de leur copie.'
        : 'Les élèves ne verront plus leur note tant que vous ne la publierez pas de nouveau.',
      confirmLabel: publier ? 'Publier' : 'Retirer',
    })
    if (ok) {
      await envoyer({ show_results: publier }, publier ? 'Notes publiées' : 'Publication retirée')
    }
  }

  async function enregistrerCorrige() {
    const reglage = { correction_release: mode.value }
    if (mode.value === 'at_date') {
      reglage.correction_release_at = new Date(date.value).toISOString()
    }
    await envoyer(reglage, 'Ouverture du corrigé enregistrée')
  }

  async function envoyer(reglage, succes) {
    enCours.value = true
    try {
      const reponse = await evaluationService.releaseEvaluation(evaluation.value.id, reglage)
      onMaj(reponse.data)
      toast.success(succes)
    } catch (err) {
      toast.error(displayMessage(err, 'La diffusion n’a pas pu être enregistrée'))
    } finally {
      enCours.value = false
    }
  }

  return { enCours, mode, date, notesPubliees, enregistrable, basculerNotes, enregistrerCorrige }
}

/** Une date ISO vers la valeur d'un champ `datetime-local` (heure du poste). */
function versSaisie(iso) {
  const d = new Date(iso)
  const deux = (n) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}`
}
