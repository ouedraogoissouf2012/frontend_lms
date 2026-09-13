import { ref } from 'vue'
import { auth } from '@/services/api'
import { extractList } from '../utils/apiList'
import { passwordResetService } from '@/services/passwordReset'

export function usePasswordReset() {
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')
  const institutions = ref([])

  async function loadInstitutions() {
    const payload = await auth.getActiveInstitutions()
    institutions.value = extractList(payload)
  }

  async function requestLink(slug, email) {
    loading.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await passwordResetService.requestLink(slug, email)
      notice.value = response.message || 'Si un compte existe, un courriel a été envoyé.'
      return true
    } catch (err) {
      error.value = err.userMessage || err.response?.data?.message || 'La demande a échoué.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(slug, payload) {
    loading.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await passwordResetService.resetPassword(slug, payload)
      notice.value = response.message || 'Mot de passe mis à jour.'
      return true
    } catch (err) {
      error.value = err.userMessage || err.response?.data?.message || 'La réinitialisation a échoué.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    notice,
    institutions,
    loadInstitutions,
    requestLink,
    resetPassword,
  }
}
