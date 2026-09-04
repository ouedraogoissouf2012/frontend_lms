import { ref, computed, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { extractList } from '@/utils/apiList'
import { useCachedResource } from '@/composables/useCachedResource'

/**
 * Couche données d'AdminSeances (#G1 ≤300) : charge les séances de visioconférence
 * (avec cache + rafraîchissement en arrière-plan), les enseignants et les classes
 * pour les filtres, et expose les filtres + actions. La vue ne fait plus que câbler.
 *
 * #224/#315 : le schéma cache + revalidation d'arrière-plan des séances est porté
 * par `useCachedResource`, en mise en cache CONDITIONNELLE — on ne met en cache
 * que lorsqu'AUCUN filtre enseignant/classe n'est actif ; sinon une liste filtrée
 * serait écrite sous la clé partagée puis servie aux vues non filtrées.
 * La clé est de plus SCOPÉE par `days` (`admin_seances_d<days>`) : `days` est un
 * paramètre serveur (envoyé à getSeances) mais n'entre pas dans `noActiveFilter` ;
 * sans scoping, passer de 30 à 7 jours servirait la liste 30 jours périmée sous la
 * même clé. Enseignants et classes (listes de filtres) restent non mis en cache.
 */
export function useAdminSeances() {
  const teachers = ref([])
  const classes = ref([])

  const filters = ref({
    days: '30',
    teacher_id: '',
    classe_id: '',
    status: ''
  })

  // Le cache n'est valide que pour la liste NON filtrée (par enseignant/classe).
  const noActiveFilter = () => !filters.value.teacher_id && !filters.value.classe_id

  /**
   * Récupère les séances selon les filtres courants. Rejette (avec `userMessage`)
   * sur `success:false` ou erreur réseau, pour que `useCachedResource` renseigne
   * `error` en conservant l'affichage précédent.
   */
  async function fetchSeances() {
    let response
    try {
      response = await klassciService.getSeances({
        days: filters.value.days,
        teacher_id: filters.value.teacher_id,
        classe_id: filters.value.classe_id
      })
    } catch (err) {
      // Préfère un message utilisateur posé par l'intercepteur, repli sur le message technique.
      err.userMessage = err.userMessage || err.message || 'Impossible de charger les séances'
      throw err
    }

    if (!response.success) {
      const err = new Error(response.message || 'Erreur lors du chargement des séances')
      err.userMessage = response.message || 'Impossible de charger les séances'
      throw err
    }

    return extractList(response)
  }

  const { data, loading, error, load } = useCachedResource(
    () => `admin_seances_d${filters.value.days}`,
    fetchSeances,
    { cacheable: noActiveFilter }
  )

  const seances = computed(() => data.value ?? [])

  async function loadTeachers() {
    try {
      const response = await klassciService.getTeachers()
      teachers.value = response || []
    } catch (err) {
      console.error('❌ Erreur chargement enseignants:', err)
    }
  }

  async function loadClasses() {
    try {
      const classesData = await klassciService.getClasses()
      classes.value = classesData || []
    } catch (err) {
      console.error('❌ Erreur chargement classes:', err)
    }
  }

  // Appelée au montage ET à chaque changement de filtre (SeancesFilters @change).
  function loadSeances() {
    return load()
  }

  function refreshData() {
    load()
    loadTeachers()
    loadClasses()
  }

  function viewSeanceDetails(seance) {
    // TODO: Ouvrir modal avec détails ou naviguer vers page détails
    console.log('Voir détails séance:', seance)
  }

  function enableVisio(seance) {
    // TODO: Activer la visioconférence pour cette séance
    console.log('Activer visio pour séance:', seance)
  }

  onMounted(() => {
    // Les séances sont déjà chargées par useCachedResource (`immediate` par défaut) ;
    // on ne complète ici que les listes de filtres (enseignants/classes) — rappeler
    // load() ici déclencherait un SECOND chargement des séances au montage.
    loadTeachers()
    loadClasses()
  })

  return {
    loading, error, seances, teachers, classes, filters,
    loadSeances, refreshData, viewSeanceDetails, enableVisio,
  }
}
