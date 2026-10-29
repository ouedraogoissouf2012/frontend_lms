import { ref } from 'vue'
import { extractList } from '@/utils/apiList'
import { schoolRequestsService } from '@/services/schoolRequests'

export function useAdminSchoolRequests() {
  const demandes = ref([])
  const loading = ref(false)
  const error = ref('')
  const page = ref(1)
  const lastPage = ref(1)
  const lienActivation = ref('')
  const messageValidation = ref('')
  // B1 (revue de #449) : le lien n'existe qu'APRÈS l'attente. Une validation EN VOL bloque
  // donc toute autre validation, et chaque demande suit SON état occupé : un identifiant
  // unique pour la page réactivait les boutons d'une demande encore en vol.
  const validationEnVol = ref(false)
  const occupees = ref(new Set())

  const estOccupee = (id) => occupees.value.has(id)
  function occuper(id) { occupees.value = new Set(occupees.value).add(id) }
  function liberer(id) {
    const reste = new Set(occupees.value)
    reste.delete(id)
    occupees.value = reste
  }
  /** Seule règle de validation : la vue s'en sert pour aria-disabled ET pour sa garde. */
  const peutValider = (id) => !validationEnVol.value && !lienActivation.value && !estOccupee(id)
  const peutRefuser = (id) => !estOccupee(id)

  async function load(cible = page.value) {
    loading.value = true
    error.value = ''
    try {
      const response = await schoolRequestsService.list(cible)
      demandes.value = extractList(response)
      page.value = response.meta?.current_page ?? cible
      lastPage.value = response.meta?.last_page ?? 1
    } catch (err) {
      error.value = err.userMessage || 'Impossible de charger les demandes.'
      demandes.value = []
    } finally {
      loading.value = false
    }
  }

  function fermerLien() {
    lienActivation.value = ''
    messageValidation.value = ''
  }

  async function valider(id, slug) {
    // #418 : un lien affiché est un SECRET que rien ne permet de réémettre
    // (ActivationTokenService::emettre n'est appelé qu'à la validation). Valider une
    // autre demande l'effaçait : refusé tant qu'il n'a pas été marqué transmis.
    if (!peutValider(id)) return false
    validationEnVol.value = true
    occuper(id)
    error.value = ''
    try {
      const response = await schoolRequestsService.validate(id, slug)
      lienActivation.value = response.data?.activation_url || ''
      messageValidation.value = response.message || 'École ouverte. Transmettez le lien : il ne sera plus affiché.'
      demandes.value = demandes.value.filter((d) => d.id !== id)
      return true
    } catch (err) {
      error.value = err.userMessage || 'La validation a échoué.'
      return false
    } finally {
      validationEnVol.value = false
      liberer(id)
    }
  }

  async function refuser(id, motif) {
    if (!peutRefuser(id)) return false
    occuper(id)
    error.value = ''
    try {
      await schoolRequestsService.refuse(id, motif)
      demandes.value = demandes.value.filter((d) => d.id !== id)
      return true
    } catch (err) {
      error.value = err.userMessage || 'Le refus a échoué.'
      return false
    } finally {
      liberer(id)
    }
  }

  return {
    demandes,
    loading,
    error,
    page,
    lastPage,
    estOccupee,
    peutValider,
    peutRefuser,
    lienActivation,
    messageValidation,
    load,
    valider,
    refuser,
    fermerLien,
  }
}
