import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { toast } from '@/services/toast'
import { STORAGE_KEYS } from '@/constants/storageKeys'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'
import { getRoleDisplayName } from '@/constants/roles'

/**
 * Couche données d'AdminSettings (#H3 ≤300) : utilisateur courant (auth.getUser),
 * préférences de notifications persistées en localStorage, modale + formulaire de
 * changement de mot de passe et déconnexion. La vue ne fait plus que câbler ces
 * éléments aux sous-composants présentationnels.
 *
 * Dette pré-existante :
 *  - `submitPasswordChange` n'appelle aucune API et n'en promet plus aucune : il
 *    n'existe pas d'endpoint backend de changement de mot de passe
 *    (cf. `@/constants/passwordChange`). Le faux message de succès a été retiré.
 *  - `logout` utilise `confirm()` natif et `console.log` reste dans
 *    `savePreferences` — conservés tels quels.
 */
export function useAdminSettings() {
  const router = useRouter()

  const user = ref(null)
  const emailNotifications = ref(true)
  const systemAlerts = ref(true)
  const showPasswordModal = ref(false)
  const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  /**
   * Libellé du rôle NORMALISÉ (#18/#659). Une table locale intitulait
   * `superAdmin` « Super Administrateur », promouvant l'admin d'ÉTABLISSEMENT au
   * rang de gestionnaire de PLATEFORME ; et son repli `|| role` faisait fuir la
   * valeur brute du backend dans l'UI pour tout rôle inconnu.
   */
  function getRoleLabel(role) {
    return getRoleDisplayName(role)
  }

  function savePreferences() {
    const preferences = {
      emailNotifications: emailNotifications.value,
      systemAlerts: systemAlerts.value,
    }
    localStorage.setItem(STORAGE_KEYS.ADMIN_PREFERENCES, JSON.stringify(preferences))
    console.log('[SETTINGS] Préférences sauvegardées:', preferences)
    toast.success('Vos préférences ont été sauvegardées')
  }

  function loadPreferences() {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PREFERENCES)
    if (saved) {
      const preferences = JSON.parse(saved)
      emailNotifications.value = preferences.emailNotifications ?? true
      systemAlerts.value = preferences.systemAlerts ?? true
    }
  }

  /**
   * Changement de mot de passe INDISPONIBLE : aucun endpoint backend à ce jour
   * (dette tracée, cf. `@/constants/passwordChange`). On n'appelle rien et on
   * n'annonce surtout aucun succès. Les champs et le bouton de la modale sont
   * désactivés ; cette fonction reste le garde-fou du chemin `@submit`.
   * REMPLACER ICI par l'appel API réel quand il existera.
   */
  function submitPasswordChange() {
    toast.info(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
  }

  function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      auth.logout()
      toast.success('Vous avez été déconnecté avec succès')
      router.push('/login')
    }
  }

  onMounted(() => {
    user.value = auth.getUser()
    loadPreferences()
  })

  return {
    user,
    emailNotifications,
    systemAlerts,
    showPasswordModal,
    passwordForm,
    getRoleLabel,
    savePreferences,
    loadPreferences,
    submitPasswordChange,
    logout,
  }
}
