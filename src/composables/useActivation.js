import { ref } from 'vue'
import { activateAccount } from '@/services/activation'
import { normalizeError } from '@/services/errorHandler'

export function useActivation() {
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')
  // #614 : le lien ne vaut plus (410). Lu sur le STATUT, jamais sur le texte : l'écran retire alors le formulaire
  // et propose « Mot de passe oublié ».
  const lienInvalide = ref(false)

  async function submit({ token, password, password_confirmation }) {
    loading.value = true
    error.value = ''
    notice.value = ''
    lienInvalide.value = false
    try {
      await activateAccount({ token, password, password_confirmation })
      notice.value = 'Votre mot de passe est enregistré. Vous pouvez vous connecter.'
      return true
    } catch (err) {
      lienInvalide.value = normalizeError(err).category === 'gone'
      error.value = err.userMessage || 'La demande a échoué.'
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, notice, lienInvalide, submit }
}
