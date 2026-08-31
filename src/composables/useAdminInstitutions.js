import { ref, computed, onMounted } from 'vue'
import { institutions as institutionsApi } from '@/services/api'
import { toast } from '@/composables/useToast'

/**
 * Couche données d'AdminInstitutions (#G1 ≤300) : état (liste + overview),
 * chargement, CRUD via la modale, bascule de statut et test de connexion KLASSCI.
 * La vue ne fait plus que câbler ; le formatage de date reste dans la table (pur).
 */
export function useAdminInstitutions() {
  // State
  const institutionsList = ref([])
  const overview = ref({})
  const loading = ref(true)
  const error = ref(null)

  // Modal state
  const showModal = ref(false)
  const editingInstitution = ref(null)
  const saving = ref(false)
  const formErrors = ref(null)

  // Connection test state
  const testingId = ref(null)
  const connectionResult = ref(null)

  // Form
  const form = ref({
    slug: '',
    name: '',
    klassci_api_url: '',
    klassci_api_token: '',
    logo_url: '',
    primary_color: '#3b82f6',
    is_active: true,
  })

  // Computed
  const totalContent = computed(() => {
    return (overview.value.total_lessons || 0) + (overview.value.total_evaluations || 0)
  })

  // Load institutions
  async function loadInstitutions() {
    try {
      loading.value = true
      error.value = null
      const response = await institutionsApi.getAll()
      if (response.success) {
        institutionsList.value = response.data.institutions
        overview.value = response.data.overview
      }
    } catch (err) {
      console.error('Erreur chargement institutions:', err)
      error.value = err.response?.data?.message || err.message || 'Erreur lors du chargement'
    } finally {
      loading.value = false
    }
  }

  // Open create modal
  function openCreateModal() {
    editingInstitution.value = null
    formErrors.value = null
    form.value = {
      slug: '',
      name: '',
      klassci_api_url: '',
      klassci_api_token: '',
      logo_url: '',
      primary_color: '#3b82f6',
      is_active: true,
    }
    showModal.value = true
  }

  // Open edit modal
  function openEditModal(inst) {
    editingInstitution.value = inst
    formErrors.value = null
    form.value = {
      slug: inst.slug,
      name: inst.name,
      klassci_api_url: inst.klassci_api_url,
      klassci_api_token: '',
      logo_url: inst.logo_url || '',
      primary_color: inst.primary_color || '#3b82f6',
      is_active: inst.is_active,
    }
    showModal.value = true
  }

  // Save institution (create or update)
  async function saveInstitution() {
    try {
      saving.value = true
      formErrors.value = null

      const payload = { ...form.value }
      // Ne pas envoyer un token vide en update (conserve l'existant)
      if (editingInstitution.value && !payload.klassci_api_token) {
        delete payload.klassci_api_token
      }
      // Nettoyer logo_url vide
      if (!payload.logo_url) {
        payload.logo_url = null
      }

      if (editingInstitution.value) {
        await institutionsApi.update(editingInstitution.value.id, payload)
      } else {
        await institutionsApi.create(payload)
      }

      showModal.value = false
      await loadInstitutions()
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        formErrors.value = err.response.data.errors
      } else {
        formErrors.value = { general: [err.response?.data?.message || err.message || 'Erreur'] }
      }
    } finally {
      saving.value = false
    }
  }

  // Toggle active/inactive
  async function toggleStatus(inst) {
    try {
      await institutionsApi.toggle(inst.id)
      await loadInstitutions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut')
    }
  }

  // Test KLASSCI connection
  async function testConnection(inst) {
    try {
      testingId.value = inst.id
      const response = await institutionsApi.testConnection(inst.id)
      connectionResult.value = response
    } catch (err) {
      connectionResult.value = {
        success: false,
        message: err.response?.data?.message || 'Erreur de connexion',
        data: err.response?.data?.data || null,
      }
    } finally {
      testingId.value = null
    }
  }

  // Close modal
  function closeModal() {
    showModal.value = false
    editingInstitution.value = null
    formErrors.value = null
  }

  onMounted(() => {
    loadInstitutions()
  })

  return {
    institutionsList, overview, loading, error,
    showModal, editingInstitution, saving, formErrors,
    testingId, connectionResult, form,
    totalContent,
    loadInstitutions, openCreateModal, openEditModal, saveInstitution,
    toggleStatus, testConnection, closeModal,
  }
}
