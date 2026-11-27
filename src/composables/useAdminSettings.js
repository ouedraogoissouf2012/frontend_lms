import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { toast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { STORAGE_KEYS } from '@/constants/storageKeys'
import { getRoleDisplayName } from '@/constants/roles'

/**
 * Couche données d'AdminSettings (#H3 ≤300) : utilisateur courant (auth.getUser),
 * préférences de notifications persistées en localStorage, ouverture de la modale
 * de changement de mot de passe et déconnexion. Le changement lui-même vit dans
 * MonMotDePasseModal / useMonMotDePasse (#674, PUT /auth/me/password).
 *
 * Dette pré-existante :
 *  - `logout` utilise `confirm()` natif et `console.log` reste dans
 *    `savePreferences` — conservés tels quels.
 */
export function useAdminSettings() {
  const router = useRouter()

  const user = ref(null)
  const emailNotifications = ref(true)
  const systemAlerts = ref(true)
  const showPasswordModal = ref(false)

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

  async function logout() {
    const ok = await useConfirm().confirm('Êtes-vous sûr de vouloir vous déconnecter ?')
    if (!ok) return
    auth.logout()
    toast.success('Vous avez été déconnecté avec succès')
    router.push('/login')
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
    getRoleLabel,
    savePreferences,
    loadPreferences,
    logout,
  }
}
