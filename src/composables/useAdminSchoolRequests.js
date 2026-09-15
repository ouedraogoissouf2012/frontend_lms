import { ref } from 'vue'
import { extractList } from '@/utils/apiList'
import { schoolRequestsService } from '@/services/schoolRequests'

export function useAdminSchoolRequests() {
  const demandes = ref([])
  const loading = ref(false)
  const error = ref('')
  const page = ref(1)
  const lastPage = ref(1)
  const actingId = ref(null)
  const lienActivation = ref('')
  const messageValidation = ref('')

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
    actingId.value = id
    error.value = ''
    fermerLien()
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
      actingId.value = null
    }
  }

  async function refuser(id, motif) {
    actingId.value = id
    error.value = ''
    try {
      await schoolRequestsService.refuse(id, motif)
      demandes.value = demandes.value.filter((d) => d.id !== id)
      return true
    } catch (err) {
      error.value = err.userMessage || 'Le refus a échoué.'
      return false
    } finally {
      actingId.value = null
    }
  }

  return {
    demandes,
    loading,
    error,
    page,
    lastPage,
    actingId,
    lienActivation,
    messageValidation,
    load,
    valider,
    refuser,
    fermerLien,
  }
}
