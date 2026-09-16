import { ref } from 'vue'
import { activateAccount } from '@/services/activation'

export function useActivation() {
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')

  async function submit({ token, password, password_confirmation }) {
    loading.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await activateAccount({ token, password, password_confirmation })
      notice.value = response.message || 'Votre mot de passe est enregistré. Vous pouvez vous connecter.'
      return true
    } catch (err) {
      error.value = err.userMessage || 'La demande a échoué.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, notice, submit }
}
