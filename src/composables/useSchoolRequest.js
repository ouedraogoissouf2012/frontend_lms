import { ref } from 'vue'
import { submitSchoolRequest } from '@/services/schoolRegistration'

const FALLBACK =
  'Votre demande est enregistrée. Elle sera examinée par notre équipe.'

export function useSchoolRequest() {
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')

  async function submit(payload) {
    loading.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await submitSchoolRequest(payload)
      notice.value = response.message || FALLBACK
      return true
    } catch (err) {
      error.value = err.userMessage || err.response?.data?.message || 'La demande a échoué.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, notice, submit }
}
