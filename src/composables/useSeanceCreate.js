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
import { clearCache, clearCacheByPrefix } from '@/services/cache'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { estPannePassagere } from '@/utils/pannePassagere'
import { isoAvecDecalage } from '@/utils/dateLocale'

// Nos messages par champ ; un 422 du serveur est rattaché au champ, jamais affiché tel quel (D0).
const MESSAGES = Object.freeze({
  titre: 'Le titre compte de 3 à 255 caractères.',
  date_seance: 'Indiquez la date et l’heure de début.',
  matiere: 'Choisissez la matière de la séance.',
  classe: 'Cette classe ne peut pas être retenue. Choisissez-en une autre.',
})
const CHAMP_DU_SERVEUR = Object.freeze({
  titre: 'titre', date_seance: 'date_seance', matiere_id: 'matiere', matiere_nom: 'matiere',
  classe_id: 'classe', classe_nom: 'classe',
})

export function useSeanceCreate({ matieres: fournies = null } = {}) {
  const catalogue = ref([])
  const liste = computed(() => {
    const source = fournies?.value ?? catalogue.value
    return Array.isArray(source) ? source : []
  })
  const matieresLocales = computed(() => liste.value.filter((m) => m?.source === 'lms_local'))
  const disponible = computed(() => matieresLocales.value.length > 0)

  const form = reactive({ matiereId: null, classeId: null, titre: '', debut: '' })
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
    const e = {}
    const titre = form.titre.trim()
    if (titre.length < 3 || titre.length > 255) e.titre = MESSAGES.titre
    if (isoAvecDecalage(form.debut) === null) e.date_seance = MESSAGES.date_seance
    if (!matiereChoisie.value) e.matiere = MESSAGES.matiere
    erreurs.value = e
    return Object.keys(e).length === 0
  }

  function charge() {
    const matiere = matiereChoisie.value
    const c = { titre: form.titre.trim(), date_seance: isoAvecDecalage(form.debut), matiere_id: matiere.id, matiere_nom: matiere.nom }
    const classe = classesDisponibles.value.find((x) => x.id === form.classeId)
    if (classe) Object.assign(c, { classe_id: classe.id, classe_nom: classe.nom })
    return c
  }

  function reinitialiser() {
    Object.assign(form, { matiereId: null, classeId: null, titre: '', debut: '' })
    erreurs.value = {}
    erreur.value = null
    canRetry.value = false
  }

  // La nouvelle séance doit paraître sur les trois écrans : leurs caches de séances sont purgés.
  function purgerCaches() {
    clearCache('teacher_seances')
    clearCacheByPrefix('seances_management_d')
    clearCacheByPrefix('admin_seances_d')
  }

  function retenirRefus(err) {
    const champs = {}
    for (const cle of Object.keys(err?.fieldErrors ?? {})) {
      const champ = CHAMP_DU_SERVEUR[cle]
      if (champ) champs[champ] = MESSAGES[champ]
    }
    erreurs.value = champs
    erreur.value = err?.fieldErrors ? ERROR_MESSAGES.validation : (err?.userMessage ?? normalizeError(err).userMessage)
    const reason = err?.response?.data?.reason
    if (reason === 'class_out_of_scope') form.classeId = null
    // La matière n'est plus de l'établissement : elle est retirée, et sa classe avec elle (watch).
    if (reason === 'subject_out_of_scope') form.matiereId = null
    canRetry.value = estPannePassagere(err)
  }

  /** @returns {Promise<Object|null>} la séance créée, ou null (refus, invalide, envoi en cours). */
  async function creer() {
    if (envoi.value) return null
    erreur.value = null
    canRetry.value = false
    if (!valider()) return null
    envoi.value = true
    try {
      const seance = await lmsSeancesService.createSeance(charge())
      purgerCaches()
      reinitialiser()
      return seance
    } catch (err) {
      retenirRefus(err)
      return null
    } finally {
      envoi.value = false
    }
  }

  return {
    disponible, matieresLocales, classesDisponibles, form, erreurs, erreur, canRetry, envoi,
    chargerCatalogue, creer, reinitialiser,
  }
}
