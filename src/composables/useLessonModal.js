import { ref } from 'vue'
import lessonService from '@/services/lesson'
import { auth } from '@/services/api'
import { createEmptyLesson, buildLessonPayload, buildLessonUpdatePayload, leconVersFormulaire } from '@/utils/matiereDetails'
import { messageForReason } from '@/services/errorHandler'
import { displayMessage } from '@/services/displayMessage'

// Le refus du serveur pour une classe hors des classes de la matière (back #1103) : dit sous le champ Classe.
const CLASSE_HORS_MATIERE = 'classe_hors_matiere'

/**
 * La modale de leçon de la page Matières : CRÉER et MODIFIER par le même formulaire (#564), avec la classe
 * CHOISIE parmi celles de la matière (back #1103). Extrait de useMatiereDetails (≤300).
 *
 * @param {{ classes: import('vue').Ref<Array>, matiereIdLocal: import('vue').Ref<?number>,
 *   notifier: (message: string, type?: string) => void, recharger: () => Promise<void>,
 *   versChapitres: (id: number) => void }} ctx
 */
export function useLessonModal({ classes, matiereIdLocal, notifier, recharger, versChapitres }) {
  const visible = ref(false)
  const enregistrement = ref(false)
  const lecon = ref(createEmptyLesson())
  // L'id de la leçon modifiée ; null en création.
  const enEdition = ref(null)
  // Le refus de la classe par le serveur, dit sous le champ (texte du catalogue) ; null sinon.
  const erreurClasse = ref(null)

  function ouvrirCreation() {
    enEdition.value = null
    erreurClasse.value = null
    lecon.value = createEmptyLesson(classes.value)
    visible.value = true
  }

  /** « Modifier » : la leçon est RELUE, puis la modale s'ouvre préremplie (classe actuelle comprise). */
  async function ouvrirEdition(lessonId) {
    erreurClasse.value = null
    try {
      const response = await lessonService.getLesson(lessonId)
      if (!response?.success || !response.data) {
        notifier(messageForReason(response?.reason) ?? 'La leçon n’a pas pu être lue. Réessayez.', 'error')
        return
      }
      lecon.value = leconVersFormulaire(response.data)
      enEdition.value = lessonId
      visible.value = true
    } catch (err) {
      notifier('La leçon n’a pas pu être lue : ' + displayMessage(err, 'réessayez.'), 'error')
    }
  }

  function fermer() {
    visible.value = false
    enEdition.value = null
    erreurClasse.value = null
    lecon.value = createEmptyLesson(classes.value)
  }

  async function envoyer() {
    if (enEdition.value) {
      const response = await lessonService.updateLesson(enEdition.value, buildLessonUpdatePayload(lecon.value))
      if (!response?.success) return notifier(messageForReason(response?.reason) ?? 'Erreur lors de la modification. Réessayez.', 'error')
      fermer()
      notifier('Leçon modifiée avec succès', 'success')
      return recharger()
    }
    const response = await lessonService.createLesson(buildLessonPayload(lecon.value, { user: auth.getUser(), matiereIdLocal: matiereIdLocal.value }))
    if (!response?.success) return notifier(messageForReason(response?.reason) ?? 'Erreur lors de la création. Réessayez.', 'error')
    fermer()
    // Rediriger vers l'interface de gestion des chapitres.
    versChapitres(response.data.id)
  }

  async function enregistrer() {
    if (!lecon.value.title || lecon.value.title.trim() === '') {
      notifier('Le titre de la leçon est obligatoire', 'warning')
      return
    }
    if (!lecon.value.classe_id) {
      notifier('Choisissez la classe de la leçon', 'warning')
      return
    }
    const quoi = enEdition.value ? 'la modification' : 'la création'
    enregistrement.value = true
    erreurClasse.value = null
    try {
      await envoyer()
    } catch (err) {
      console.error('[MatiereDetails] Erreur enregistrement leçon:', err)
      if (err?.response?.data?.reason === CLASSE_HORS_MATIERE) erreurClasse.value = messageForReason(CLASSE_HORS_MATIERE)
      else notifier(`Erreur lors de ${quoi} : ` + displayMessage(err, 'réessayez.'), 'error')
    } finally {
      enregistrement.value = false
    }
  }

  return { visible, enregistrement, lecon, enEdition, erreurClasse, ouvrirCreation, ouvrirEdition, fermer, enregistrer }
}
