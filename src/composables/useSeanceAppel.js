import { ref } from 'vue'
import { lmsSeancesService } from '@/services/lmsSeances'
import { messageDe } from '@/services/errorHandler'
import { purgerCachesSeances } from '@/utils/seanceForm'

/**
 * L'appel d'une séance (lms_backend#1649, #719) : charger la classe, poser les marques, enregistrer.
 *
 * - `marques` : par élève, sa marque (`present`, `absent`, `late`, `excused`) ou `null` ; seules les marques posées
 *   partent au serveur, qui garde l'historique et audite chaque correction ;
 * - un envoi à la fois ; l'appel relu remplace l'affichage ;
 * - D0 : un refus est dit par le catalogue des motifs (`seance_not_started`, `attendance_managed_by_klassci`,
 *   `student_not_in_seance`), jamais par le texte du serveur.
 *
 * @param {import('vue').Ref<{ id: number }>} seance la séance de la carte
 */
export function useSeanceAppel(seance) {
  const eleves = ref([])
  const marques = ref({})
  const chargement = ref(false)
  const envoi = ref(false)
  const erreur = ref(null)

  function retenir(appel) {
    eleves.value = Array.isArray(appel?.eleves) ? appel.eleves : []
    marques.value = Object.fromEntries(eleves.value.map((e) => [e.user_id, e.mark ?? null]))
  }

  async function charger() {
    chargement.value = true
    erreur.value = null
    try {
      retenir(await lmsSeancesService.getAppel(seance.value.id))
    } catch (err) {
      erreur.value = messageDe(err)
    } finally {
      chargement.value = false
    }
  }

  /** @returns {Promise<boolean>} vrai si l'appel est enregistré (et relu). */
  async function enregistrer() {
    if (envoi.value) return false
    const posees = eleves.value
      .filter((e) => marques.value[e.user_id])
      .map((e) => ({ user_id: e.user_id, mark: marques.value[e.user_id] }))
    if (posees.length === 0) return false
    envoi.value = true
    erreur.value = null
    try {
      retenir(await lmsSeancesService.saveAppel(seance.value.id, posees))
      // Les écrans de présence doivent relire la marque, qui l'emporte sur la visio.
      purgerCachesSeances()
      return true
    } catch (err) {
      erreur.value = messageDe(err)
      return false
    } finally {
      envoi.value = false
    }
  }

  return { eleves, marques, chargement, envoi, erreur, charger, enregistrer }
}
