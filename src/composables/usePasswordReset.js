import { ref } from 'vue'
import { auth } from '@/services/api'
import { extractList } from '../utils/apiList'
import { passwordResetService } from '@/services/passwordReset'
import { displayMessage } from '@/services/displayMessage'

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
      await passwordResetService.requestLink(slug, email)
      notice.value = 'Si un compte existe, un courriel a été envoyé.'
      return true
    } catch (err) {
      error.value = displayMessage(err, 'La demande a échoué.')
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
      await passwordResetService.resetPassword(slug, payload)
      notice.value = 'Mot de passe mis à jour.'
      return true
    } catch (err) {
      error.value = displayMessage(err, 'La réinitialisation a échoué.')
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
