import { ref } from 'vue'
import { submitSchoolRequest } from '@/services/schoolRegistration'
import { displayMessage } from '@/services/displayMessage'

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
      await submitSchoolRequest(payload)
      notice.value = FALLBACK
      return true
    } catch (err) {
      error.value = displayMessage(err, 'La demande a échoué.')
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, notice, submit }
}
