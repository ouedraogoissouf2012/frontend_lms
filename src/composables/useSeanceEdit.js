/**
 * Modification d'une séance LOCALE (lms_backend#1121, ARRÊT 1 validé par la superviseure) : titre, date et heure,
 * classe ; la matière ne change pas.
 *
 * - qui peut modifier : le SERVEUR le dit par `can_be_edited` (la carte n'offre le bouton que sur ce champ) ;
 * - préremplie depuis la séance de la liste : `titre`, `date_debut` (à l'heure locale), `classe` ;
 * - les classes proposées sont celles de la carte locale de SA matière, dans le catalogue de la création ; la
 *   classe actuelle reste proposée même si le catalogue ne la porte plus (le serveur tranchera) ;
 * - un envoi à la fois ; après succès, les caches des trois écrans sont purgés ;
 * - D0 : aucun texte du serveur ; les messages par champ et le catalogue des motifs (`seanceForm`).
 *
 * @param {import('vue').Ref<Object>} seance la séance de la carte
 */
import { ref, reactive, computed } from 'vue'
import { lmsSeancesService } from '@/services/lmsSeances'
import { fetchTeacherMatieres } from '@/services/teacherReferentials'
import { isoAvecDecalage, saisieLocale } from '@/utils/dateLocale'
import { erreursTitreEtDebut, lireRefusSeance, purgerCachesSeances } from '@/utils/seanceForm'

export function useSeanceEdit(seance) {
  const catalogue = ref([])
  const form = reactive({ classeId: null, titre: '', debut: '' })
  const erreurs = ref({})
  const erreur = ref(null)
  const canRetry = ref(false)
  const envoi = ref(false)

  const matiereNom = computed(() => seance.value?.matiere?.nom ?? seance.value?.matiere?.libelle ?? '')
  const classesDisponibles = computed(() => {
    const carte = catalogue.value.find((m) => m?.source === 'lms_local' && m.id === seance.value?.matiere?.id)
    const classes = Array.isArray(carte?.classes) ? [...carte.classes] : []
    const actuelle = seance.value?.classe
    if (actuelle?.id != null && !classes.some((c) => c.id === actuelle.id)) {
      classes.unshift({ id: actuelle.id, nom: actuelle.nom ?? actuelle.libelle ?? '' })
    }
    return classes
  })

  /** Prépare la fenêtre : le formulaire prérempli, puis le catalogue (lu à l'ouverture, pas par carte). */
  async function ouvrir() {
    Object.assign(form, {
      classeId: seance.value?.classe?.id ?? null,
      titre: seance.value?.titre ?? '',
      debut: saisieLocale(seance.value?.date_debut) ?? '',
    })
    erreurs.value = {}
    erreur.value = null
    canRetry.value = false
    try {
      catalogue.value = await fetchTeacherMatieres()
    } catch {
      catalogue.value = []
    }
  }

  function charge() {
    const classe = classesDisponibles.value.find((c) => c.id === form.classeId) ?? null
    return {
      titre: form.titre.trim(),
      date_seance: isoAvecDecalage(form.debut),
      classe_id: classe?.id ?? null,
      classe_nom: classe?.nom ?? null,
    }
  }

  function retenirRefus(err) {
    const refus = lireRefusSeance(err)
    erreurs.value = refus.erreurs
    erreur.value = refus.erreur
    if (refus.reason === 'class_out_of_scope') form.classeId = null
    canRetry.value = refus.canRetry
  }

  /** @returns {Promise<Object|null>} la séance relue, ou null (refus, invalide, envoi en cours). */
  async function modifier() {
    if (envoi.value) return null
    erreur.value = null
    canRetry.value = false
    erreurs.value = erreursTitreEtDebut(form)
    if (Object.keys(erreurs.value).length > 0) return null
    envoi.value = true
    try {
      const relue = await lmsSeancesService.updateSeance(seance.value.id, charge())
      purgerCachesSeances()
      return relue
    } catch (err) {
      retenirRefus(err)
      return null
    } finally {
      envoi.value = false
    }
  }

  return { form, erreurs, erreur, canRetry, envoi, matiereNom, classesDisponibles, ouvrir, modifier }
}
