/**
 * Création d'une séance LOCALE (école créée depuis le LMS) : un seul composable pour les trois écrans
 * de séances (enseignant, coordinateur, gestion). ARRÊT 1 validé par la superviseure :
 *
 * - offerte SEULEMENT si le catalogue de `/proxy/matieres` porte des cartes `source: 'lms_local'`
 *   (D3, D172). Dans une école KLASSCI, les ids sont ceux de KLASSCI : le serveur refuserait la
 *   classe, et les séances viennent de KLASSCI ;
 * - le couple matière/classe vient de la MÊME carte (ids locaux) ;
 * - `date_seance` est le DÉBUT, en ISO 8601 avec décalage (D4). Aucune fin : elle est estimée par
 *   le serveur, et l'écran le dit (lot « lecture honnête ») ;
 * - `matiere_id` est l'id local de la MÊME carte que la classe (contrat S-matière fixé ; à déployer
 *   APRÈS B-source et S-matière côté back) ;
 * - pas de double création : un envoi à la fois ;
 * - D0 : aucun texte du serveur n'est affiché, même sur un 422 (nos messages par champ).
 *
 * @param {{ matieres?: import('vue').Ref<Array|null> }} [options] le catalogue déjà chargé par
 *   l'écran ; sans lui, `chargerCatalogue` le lit (même source que l'écran enseignant).
 */
import { ref, reactive, computed, watch } from 'vue'
import { lmsSeancesService } from '@/services/lmsSeances'
import { fetchTeacherMatieres } from '@/services/teacherReferentials'
import { isoAvecDecalage } from '@/utils/dateLocale'
import { MESSAGES_SEANCE, chargeDuCreneau, erreursTitreEtDebut, lireRefusSeance, purgerCachesSeances } from '@/utils/seanceForm'
import { usePeutForcerUnConflit } from '@/composables/usePeutForcerUnConflit'

export function useSeanceCreate({ matieres: fournies = null } = {}) {
  const catalogue = ref([])
  const liste = computed(() => {
    const source = fournies?.value ?? catalogue.value
    return Array.isArray(source) ? source : []
  })
  const matieresLocales = computed(() => liste.value.filter((m) => m?.source === 'lms_local'))
  const disponible = computed(() => matieresLocales.value.length > 0)

  const form = reactive({ matiereId: null, classeId: null, titre: '', debut: '', fin: '', type: '' })
  const matiereChoisie = computed(() => matieresLocales.value.find((m) => m.id === form.matiereId) ?? null)
  const classesDisponibles = computed(() => (Array.isArray(matiereChoisie.value?.classes) ? matiereChoisie.value.classes : []))

  // Changer de matière : une classe qui n'est pas au programme de la nouvelle est retirée.
  watch(() => form.matiereId, () => {
    if (!classesDisponibles.value.some((c) => c.id === form.classeId)) form.classeId = null
  })

  const erreurs = ref({})
  const erreur = ref(null)
  const canRetry = ref(false)
  const envoi = ref(false)
  // #675 : les séances qui gênent le créneau (409), et le droit de passer outre (la gestion seule).
  const conflits = ref([])
  const peutForcer = usePeutForcerUnConflit()

  /** Lit le catalogue quand l'écran ne le fournit pas. Un échec laisse l'action indisponible. */
  async function chargerCatalogue() {
    if (fournies) return
    try {
      catalogue.value = await fetchTeacherMatieres()
    } catch {
      catalogue.value = []
    }
  }

  function valider() {
    const e = erreursTitreEtDebut(form)
    if (!matiereChoisie.value) e.matiere = MESSAGES_SEANCE.matiere
    erreurs.value = e
    return Object.keys(e).length === 0
  }

  function charge() {
    const matiere = matiereChoisie.value
    const c = { titre: form.titre.trim(), date_seance: isoAvecDecalage(form.debut), matiere_id: matiere.id, matiere_nom: matiere.nom, ...chargeDuCreneau(form) }
    const classe = classesDisponibles.value.find((x) => x.id === form.classeId)
    if (classe) Object.assign(c, { classe_id: classe.id, classe_nom: classe.nom })
    return c
  }

  function reinitialiser() {
    Object.assign(form, { matiereId: null, classeId: null, titre: '', debut: '', fin: '', type: '' })
    erreurs.value = {}
    erreur.value = null
    canRetry.value = false
    conflits.value = []
  }

  function retenirRefus(err) {
    const refus = lireRefusSeance(err)
    erreurs.value = refus.erreurs
    erreur.value = refus.erreur
    conflits.value = refus.conflits
    if (refus.reason === 'class_out_of_scope') form.classeId = null
    // La matière n'est plus de l'établissement : elle est retirée, et sa classe avec elle (watch).
    if (refus.reason === 'subject_out_of_scope') form.matiereId = null
    canRetry.value = refus.canRetry
  }

  /**
   * @param {boolean} [forcer] passer outre un conflit d'horaire (la gestion seule ; le serveur en juge)
   * @returns {Promise<Object|null>} la séance créée, ou null (refus, invalide, envoi en cours).
   */
  async function creer(forcer = false) {
    if (envoi.value) return null
    erreur.value = null
    canRetry.value = false
    conflits.value = []
    if (!valider()) return null
    envoi.value = true
    try {
      const seance = await lmsSeancesService.createSeance({ ...charge(), ...(forcer === true && { forcer_conflit: true }) })
      // La nouvelle séance doit paraître sur les trois écrans : leurs caches de séances sont purgés.
      purgerCachesSeances()
      reinitialiser()
      return seance
    } catch (err) {
      retenirRefus(err)
      return null
    } finally {
      envoi.value = false
    }
  }

  /** « Créer quand même » : la même charge, avec le forçage. */
  const creerQuandMeme = () => creer(true)

  return {
    disponible, matieresLocales, classesDisponibles, form, erreurs, erreur, canRetry, envoi, conflits, peutForcer,
    chargerCatalogue, creer, creerQuandMeme, reinitialiser,
  }
}
