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
 * - #675 (lms_backend#1668) : le type et la fin se modifient ; la fin n'est préremplie que si elle est RÉELLE
 *   (une fin estimée, `heure_fin_estimee`, n'a pas été saisie). Un conflit d'horaire nomme les séances en
 *   cause, et la gestion peut « Enregistrer quand même ».
 *
 * @param {import('vue').Ref<Object>} seance la séance de la carte
 */
import { ref, reactive, computed } from 'vue'
import { lmsSeancesService } from '@/services/lmsSeances'
import { fetchTeacherMatieres } from '@/services/teacherReferentials'
import { isoAvecDecalage, saisieLocale } from '@/utils/dateLocale'
import { chargeDuCreneau, erreursTitreEtDebut, lireRefusSeance, purgerCachesSeances } from '@/utils/seanceForm'
import { usePeutForcerUnConflit } from '@/composables/usePeutForcerUnConflit'

export function useSeanceEdit(seance) {
  const catalogue = ref([])
  const form = reactive({ classeId: null, titre: '', debut: '', fin: '', type: '' })
  const erreurs = ref({})
  const erreur = ref(null)
  const canRetry = ref(false)
  const envoi = ref(false)
  const conflits = ref([])
  const peutForcer = usePeutForcerUnConflit()

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
      fin: seance.value?.heure_fin_estimee === false ? (saisieLocale(seance.value?.date_fin) ?? '') : '',
      type: seance.value?.type_seance ?? '',
    })
    erreurs.value = {}
    erreur.value = null
    canRetry.value = false
    conflits.value = []
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
      ...chargeDuCreneau(form),
    }
  }

  function retenirRefus(err) {
    const refus = lireRefusSeance(err)
    erreurs.value = refus.erreurs
    erreur.value = refus.erreur
    conflits.value = refus.conflits
    if (refus.reason === 'class_out_of_scope') form.classeId = null
    canRetry.value = refus.canRetry
  }

  /**
   * @param {boolean} [forcer] passer outre un conflit d'horaire (la gestion seule ; le serveur en juge)
   * @returns {Promise<Object|null>} la séance relue, ou null (refus, invalide, envoi en cours).
   */
  async function modifier(forcer = false) {
    if (envoi.value) return null
    erreur.value = null
    canRetry.value = false
    conflits.value = []
    erreurs.value = erreursTitreEtDebut(form)
    if (Object.keys(erreurs.value).length > 0) return null
    envoi.value = true
    try {
      const relue = await lmsSeancesService.updateSeance(seance.value.id, { ...charge(), ...(forcer === true && { forcer_conflit: true }) })
      purgerCachesSeances()
      return relue
    } catch (err) {
      retenirRefus(err)
      return null
    } finally {
      envoi.value = false
    }
  }

  /** « Enregistrer quand même » : la même charge, avec le forçage. */
  const modifierQuandMeme = () => modifier(true)

  return {
    form, erreurs, erreur, canRetry, envoi, conflits, peutForcer, matiereNom, classesDisponibles,
    ouvrir, modifier, modifierQuandMeme,
  }
}
