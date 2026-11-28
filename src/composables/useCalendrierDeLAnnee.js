import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { calendrierService } from '@/services/calendrier'
import { listerClassesDeLEtablissement } from '@/services/classesDeLEtablissement'
import { hasRole, ROLES } from '@/constants/roles'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { plageDuMois } from '@/utils/calendrierDeLAnnee'

/**
 * L'écran « Calendrier de l'année » (#678) : le mois affiché, ses événements, la vue (mois ou liste), et ce que la
 * gestion peut écrire. Tout membre lit ; l'écriture n'est MONTRÉE qu'à la gestion (coordinateur, admin), le serveur
 * fait foi (403 dit par le catalogue). Les classes de la portée ne sont lues que pour la gestion : la liste de
 * l'établissement lui est réservée, et elle porte l'id LOCAL dans les deux volets.
 */
export function useCalendrierDeLAnnee() {
  const { user } = storeToRefs(useAuthStore())
  const estGestion = computed(() => user.value != null || hasRole(user.value, [ROLES.COORDINATEUR, ROLES.ADMIN])) // MUTATION K3
  const mois = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const vue = ref('mois')
  const evenements = ref([])
  const classes = ref([])
  const chargement = ref(true)
  const erreur = ref('')
  // Une panne de la liste des classes ne cache pas le calendrier : elle n'empêche que de choisir une portée.
  const erreurClasses = ref('')
  const annonce = ref('')

  const plage = computed(() => plageDuMois(mois.value))
  const libelleDuMois = computed(() => mois.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
  const libelleDeClasse = (id) => classes.value.find((c) => c.id === id)?.libelle ?? null

  async function charger() {
    erreur.value = ''
    try {
      evenements.value = await calendrierService.lire(plage.value)
    } catch (err) {
      evenements.value = []
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      chargement.value = false
    }
  }

  async function chargerClasses() {
    if (!estGestion.value) return
    try {
      classes.value = await listerClassesDeLEtablissement()
    } catch (err) {
      erreurClasses.value = err?.userMessage || ERROR_MESSAGES.unknown
    }
  }

  function changerDeMois(decalage) {
    mois.value = new Date(mois.value.getFullYear(), mois.value.getMonth() + decalage, 1)
    return charger()
  }

  const moisCourant = () => {
    mois.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    return charger()
  }

  onMounted(() => Promise.all([charger(), chargerClasses()]))

  return { estGestion, mois, vue, evenements, classes, chargement, erreur, erreurClasses, annonce, plage, libelleDuMois, libelleDeClasse, charger, changerDeMois, moisCourant }
}
